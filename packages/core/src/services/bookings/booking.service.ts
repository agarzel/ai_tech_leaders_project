import { Booking, CURRENCY, LockMode, MentorProfile, Payment, User, type EntityManager } from "@devmentor/db";
import type { Clock } from "../../clock";
import type { Env } from "../../config/env";
import { ConflictError, ForbiddenError } from "../../http/errors";
import { parseOrThrow } from "../../http/body";
import type { PaymentGateway } from "../../payments/payment-gateway";
import { bookingCreateSchema } from "../../validators/bookings/booking-create.schema";
import type { SlotService } from "../availability/slot.service";
import type { MentorService } from "../mentors/mentor.service";

/** A new booking holds its slot this long while the mentee pays (spec: Hold, 35 min). */
export const BOOKING_HOLD_MINUTES = 35;
/** The Checkout session ends this long before the hold does (spec: state machine). */
export const CHECKOUT_MARGIN_MINUTES = 1;

const MINUTE_MS = 60_000;

/** What the mentee needs next: the booking to follow and where to pay. */
export type CreatedBookingDto = { bookingId: string; checkoutUrl: string };

export class BookingService {
  constructor(
    private readonly deps: {
      em: EntityManager;
      clock: Clock;
      env: Pick<Env, "APP_URL" | "PAYMENTS_PROVIDER">;
      paymentGateway: PaymentGateway;
      slotService: SlotService;
      mentorService: MentorService;
    },
  ) {}

  /**
   * Books a slot for the caller: validates, then in one transaction locks the slot, re-checks it, stores the price
   * read now, creates the `pending_payment` booking with its hold and a `creating` payment. Only after the commit
   * is the Checkout session created; if that fails, the booking and payment stay for the sweep to retry.
   */
  async create(menteeUserId: string, input: unknown): Promise<CreatedBookingDto> {
    const { slotId, lengthMinutes, question, entryPoint } = parseOrThrow(bookingCreateSchema, input);
    const now = this.deps.clock.now();
    const holdExpiresAt = new Date(now.getTime() + BOOKING_HOLD_MINUTES * MINUTE_MS);

    const created = await this.deps.em.transactional(async (em) => {
      // Serialize creates by this mentee before counting, even when they target different slots.
      await em.findOne(User, { id: menteeUserId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      const activePendingBookings = await em.count(Booking, {
        mentee: menteeUserId,
        status: "pending_payment",
        holdExpiresAt: { $gt: now },
      });
      if (activePendingBookings >= 2) {
        throw new ConflictError("Finish or abandon your previous payment first");
      }

      // SELECT ... FOR UPDATE on the slot: a parallel booking of the same slot waits here and then sees it taken.
      const slot = await this.deps.slotService.assertBookable(slotId, now, em, LockMode.PESSIMISTIC_WRITE);
      const mentorId = slot.mentor.id;
      if ((await em.count(MentorProfile, { id: mentorId, user: menteeUserId })) > 0) {
        throw new ForbiddenError("You cannot book your own slot");
      }
      const priceAmount = await this.deps.mentorService.priceFor(mentorId, lengthMinutes);

      slot.status = "booked";
      const booking = em.create(Booking, {
        slot,
        mentee: em.getReference(User, menteeUserId),
        mentor: slot.mentor,
        lengthMinutes,
        priceAmount,
        question,
        entryPoint,
        holdExpiresAt,
      });
      const idempotencyKey = `checkout:${booking.id}`;
      const payment = em.create(Payment, {
        booking,
        provider: this.deps.env.PAYMENTS_PROVIDER,
        checkoutIdempotencyKey: idempotencyKey,
        amount: priceAmount,
      });
      await em.flush();
      return { bookingId: booking.id, paymentId: payment.id, idempotencyKey, priceAmount };
    });

    // After the commit: a slow or failing provider never holds a database transaction open.
    const returnUrl = new URL(`/bookings/${created.bookingId}`, this.deps.env.APP_URL).toString();
    const session = await this.deps.paymentGateway.createCheckout({
      bookingId: created.bookingId,
      amount: created.priceAmount,
      currency: CURRENCY,
      description: `DevMentor session, ${lengthMinutes} min`,
      successUrl: returnUrl,
      cancelUrl: returnUrl,
      expiresAt: new Date(holdExpiresAt.getTime() - CHECKOUT_MARGIN_MINUTES * MINUTE_MS),
      idempotencyKey: created.idempotencyKey,
    });
    // Conditional: the sweep may have retried the session in the meantime.
    await this.deps.em.nativeUpdate(
      Payment,
      { id: created.paymentId, status: "creating" },
      { status: "open", checkoutSessionId: session.sessionId },
    );
    return { bookingId: created.bookingId, checkoutUrl: session.url };
  }
}
