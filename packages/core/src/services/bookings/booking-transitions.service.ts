import { Booking, LockMode, MentorProfile, Payment, Slot, type EntityManager, type IBooking, type IPayment } from "@devmentor/db";
import type { Clock } from "../../clock";
import { parseOrThrow } from "../../http/body";
import { ConflictError, NotFoundError } from "../../http/errors";
import type { Logger } from "../../logger";
import type { PaymentEvent } from "../../payments/payment-gateway";
import { bookingDeclineSchema } from "../../validators/bookings/booking-decline.schema";
import type { SlotService } from "../availability/slot.service";
import { cancellationOutcome, type CancellationOutcome } from "../sessions/session-rules";
import { recordRefundFailures } from "./payment-refund-attempts";
import { MAX_REFUND_ATTEMPTS } from "./sweep.service";

/** The mentor decides until this many hours before the session starts (spec: state machine, R05). */
export const ACCEPTANCE_LEAD_HOURS = 12;

const HOUR_MS = 3_600_000;
const DEADLINE_MESSAGE = "The acceptance deadline has passed";
// Payment states after a paid event was applied: a repeated event finds one of these and changes nothing.
const SETTLED_PAYMENT_STATUSES: readonly string[] = ["paid", "refund_requested", "refunded", "refund_failed"];

type PaidEvent = Extract<PaymentEvent, { type: "checkout.completed" }>;

/**
 * The booking state machine: every status change after creation lives here. Each transition locks the booking
 * row inside a transaction and re-checks the current status, so a repeated or racing webhook, mentor click or
 * sweep changes nothing twice. A slot is released only after the booking has left the live statuses.
 */
export class BookingTransitions {
  constructor(private readonly deps: { em: EntityManager; clock: Clock; logger: Logger; slotService: SlotService }) {}

  /** Applies a verified provider event: a paid Checkout completion or a refund outcome. Anything else is ignored. */
  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    if (event.type === "refund.updated") {
      await this.applyRefundOutcome(event);
      return;
    }
    if (event.type !== "checkout.completed") {
      this.deps.logger.info({ providerType: event.providerType }, "Payment event ignored: type not handled");
      return;
    }
    if (event.paymentStatus !== "paid") {
      this.deps.logger.warn({ sessionId: event.sessionId, paymentStatus: event.paymentStatus }, "Checkout completed without payment, ignored");
      return;
    }
    const known = await this.deps.em.findOne(Payment, { checkoutSessionId: event.sessionId });
    if (!known) {
      this.deps.logger.warn({ sessionId: event.sessionId }, "Payment event ignored: unknown checkout session");
      return;
    }
    const slotId = await this.applyPaid(event, known.booking.id);
    if (slotId) await this.deps.slotService.release(slotId);
  }

  /** The mentor takes the session. Only the booking's own mentor, only while it awaits acceptance and before the deadline. */
  async accept(mentorUserId: string, bookingId: string): Promise<void> {
    const now = this.deps.clock.now();
    await this.deps.em.transactional(async (em) => {
      const booking = await this.lockOwnAwaiting(em, mentorUserId, bookingId, now);
      booking.status = "confirmed";
      booking.decidedAt = now;
      await em.flush();
    });
  }

  /** The mentor declines: the mentee is refunded (requested here, performed by the sweep) and the slot is freed. */
  async decline(mentorUserId: string, bookingId: string, reason?: string): Promise<void> {
    const { reason: parsed } = parseOrThrow(bookingDeclineSchema, { reason });
    const now = this.deps.clock.now();
    const slotId = await this.deps.em.transactional(async (em) => {
      const booking = await this.lockOwnAwaiting(em, mentorUserId, bookingId, now);
      booking.status = "declined";
      booking.decidedAt = now;
      booking.declineReason = parsed || null;
      await this.requestRefund(em, booking);
      await em.flush();
      return booking.slot.id;
    });
    await this.deps.slotService.release(slotId);
  }

  /** The acceptance deadline passed: `awaiting_acceptance` becomes `expired`, refund requested, slot freed. False when nothing changed. */
  async expireAcceptance(bookingId: string, now: Date): Promise<boolean> {
    const slotId = await this.deps.em.transactional(async (em) => {
      const booking = await em.findOne(Booking, { id: bookingId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!booking || booking.status !== "awaiting_acceptance" || !booking.acceptBy || booking.acceptBy.getTime() > now.getTime()) return null;
      booking.status = "expired";
      await this.requestRefund(em, booking);
      await em.flush();
      return booking.slot.id;
    });
    if (!slotId) return false;
    await this.deps.slotService.release(slotId);
    return true;
  }

  /** The hold passed without payment: `pending_payment` becomes `payment_expired` and the slot is freed. False when nothing changed. */
  async expirePayment(bookingId: string, now: Date): Promise<boolean> {
    const slotId = await this.deps.em.transactional(async (em) => {
      const booking = await em.findOne(Booking, { id: bookingId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!booking || booking.status !== "pending_payment" || booking.holdExpiresAt.getTime() > now.getTime()) return null;
      booking.status = "payment_expired";
      const payment = await em.findOne(Payment, { booking: booking.id });
      if (payment && (payment.status === "creating" || payment.status === "open")) payment.status = "expired";
      await em.flush();
      return booking.slot.id;
    });
    if (!slotId) return false;
    await this.deps.slotService.release(slotId);
    return true;
  }

  /** Returns the slot id to release, or null when the event changed nothing or left the slot held. */
  private async applyPaid(event: PaidEvent, bookingId: string): Promise<string | null> {
    const now = this.deps.clock.now();
    return this.deps.em.transactional(async (em) => {
      const booking = await em.findOneOrFail(Booking, { id: bookingId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      // Read after the lock: a concurrent delivery of the same event has committed by now.
      const payment = await em.findOneOrFail(Payment, { booking: bookingId });
      if (SETTLED_PAYMENT_STATUSES.includes(payment.status)) return null;
      if (event.bookingId !== booking.id || event.amountTotal !== payment.amount || event.currency?.toUpperCase() !== payment.currency) {
        this.deps.logger.error({ sessionId: event.sessionId, bookingId: booking.id }, "Paid event does not match the booking, no transition");
        return null;
      }

      payment.paidAt = now;
      payment.paymentIntentId = event.paymentIntentId;
      if (booking.status === "pending_payment") {
        const slot = await em.findOneOrFail(Slot, { id: booking.slot.id });
        const acceptBy = new Date(slot.startsAt.getTime() - ACCEPTANCE_LEAD_HOURS * HOUR_MS);
        if (acceptBy.getTime() > now.getTime()) {
          booking.status = "awaiting_acceptance";
          booking.acceptBy = acceptBy;
          payment.status = "paid";
          await em.flush();
          return null;
        }
        // Paid too close to the session for the mentor to decide: nobody can accept, so return the money.
        booking.status = "payment_expired";
      }
      // Late paid (the hold was already given up) or an unexpected state: never a second booking, refund in full.
      payment.status = "refund_requested";
      await em.flush();
      return booking.slot.id;
    });
  }

  /** A refund webhook's final outcome: moves `refund_requested` to `refunded`, or counts a failed attempt (spec: 3 max). */
  private async applyRefundOutcome(event: Extract<PaymentEvent, { type: "refund.updated" }>): Promise<void> {
    const now = this.deps.clock.now();
    await this.deps.em.transactional(async (em) => {
      const payment = await em.findOne(Payment, { paymentIntentId: event.paymentIntentId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!payment || payment.status !== "refund_requested") return;
      if (event.status === "succeeded") {
        payment.status = "refunded";
        payment.refundId = event.refundId;
        payment.refundedAt = now;
        payment.lastError = null;
        await em.flush();
        return;
      }
      if (recordRefundFailures(payment, [event.refundId]) === 0) return;
      payment.lastError = "Refund failed (webhook)";
      if (payment.refundAttempts >= MAX_REFUND_ATTEMPTS) {
        payment.status = "refund_failed";
        this.deps.logger.error({ paymentIntentId: event.paymentIntentId, refundAttempts: payment.refundAttempts }, "Refund failed after the maximum attempts");
      }
      await em.flush();
    });
  }

  /**
   * The mentee cancels a confirmed booking (E03 S02). Free until 12 h before the start: the payment is refunded
   * in full (requested here, performed by the sweep). Later the mentor keeps the payment, recorded as their share.
   * The slot is freed either way.
   */
  async cancelByMentee(menteeUserId: string, bookingId: string): Promise<CancellationOutcome> {
    const now = this.deps.clock.now();
    const result = await this.deps.em.transactional(async (em) => {
      const booking = await em.findOne(Booking, { id: bookingId }, { lockMode: LockMode.PESSIMISTIC_WRITE, populate: ["slot"] });
      // Another person's booking looks like a missing one, so ids do not leak.
      if (!booking || booking.mentee.id !== menteeUserId) throw new NotFoundError("Booking not found");
      if (booking.status !== "confirmed") throw new ConflictError("Only a confirmed booking can be cancelled");

      const outcome = cancellationOutcome(booking.slot.startsAt, now);
      booking.status = "cancelled";
      booking.cancelledAt = now;
      booking.cancelReason = outcome === "refunded" ? "mentee_free" : "mentee_late";

      const payment: IPayment | null = await em.findOne(Payment, { booking: booking.id });
      if (outcome === "refunded") {
        if (payment?.status === "paid") payment.status = "refund_requested";
      } else if (payment) {
        payment.mentorShareAmount = booking.priceAmount;
      }
      await em.flush();
      return { outcome, slotId: booking.slot.id };
    });
    await this.deps.slotService.release(result.slotId);
    return result.outcome;
  }

  private async lockOwnAwaiting(em: EntityManager, mentorUserId: string, bookingId: string, now: Date): Promise<IBooking> {
    const booking = await em.findOne(Booking, { id: bookingId }, { lockMode: LockMode.PESSIMISTIC_WRITE });
    // Another mentor's booking looks like a missing one, so ids do not leak.
    if (!booking || (await em.count(MentorProfile, { id: booking.mentor.id, user: mentorUserId })) === 0) {
      throw new NotFoundError("Booking not found");
    }
    if (booking.status !== "awaiting_acceptance") throw new ConflictError("This booking is no longer awaiting your decision");
    if (!booking.acceptBy || booking.acceptBy.getTime() <= now.getTime()) throw new ConflictError(DEADLINE_MESSAGE);
    return booking;
  }

  private async requestRefund(em: EntityManager, booking: IBooking): Promise<void> {
    const payment: IPayment | null = await em.findOne(Payment, { booking: booking.id });
    if (payment?.status === "paid") payment.status = "refund_requested";
  }
}
