import { Booking, LockMode, Payment, type EntityManager, type IPayment } from "@devmentor/db";
import type { Clock } from "../../clock";
import type { Env } from "../../config/env";
import type { Logger } from "../../logger";
import type { PaymentGateway } from "../../payments/payment-gateway";
import { CHECKOUT_MARGIN_MINUTES } from "./booking.service";
import type { BookingTransitions } from "./booking-transitions.service";
import { recordRefundFailures } from "./payment-refund-attempts";

/** Spec: a payment stuck in `creating` this long lost its Checkout call (crash between commit and the provider call). */
export const CHECKOUT_RETRY_AFTER_MINUTES = 2;
/** Spec (refund lifecycle): `refund_failed` after three attempts. */
export const MAX_REFUND_ATTEMPTS = 3;
/** Spec: at most 100 items per step and call. */
export const SWEEP_BATCH_SIZE = 100;

const MINUTE_MS = 60_000;
const LAST_ERROR_MAX_LENGTH = 200;

export type SweepSummary = {
  checkoutsRetried: number;
  holdsExpired: number;
  bookingsExpired: number;
  refundsReconciled: number;
  failed: number;
};

type Counter = keyof Omit<SweepSummary, "failed">;

/**
 * Deadline and recovery work, called by an external scheduler. Idempotent: a second run right after the first changes
 * nothing. Every item runs on its own, so one failing booking or payment is counted in `failed` and the rest go on.
 */
export class SweepService {
  constructor(
    private readonly deps: {
      em: EntityManager;
      clock: Clock;
      env: Env;
      logger: Logger;
      paymentGateway: PaymentGateway;
      bookingTransitions: BookingTransitions;
    },
  ) {}

  async run(now: Date = this.deps.clock.now()): Promise<SweepSummary> {
    const summary: SweepSummary = { checkoutsRetried: 0, holdsExpired: 0, bookingsExpired: 0, refundsReconciled: 0, failed: 0 };
    await this.each(await this.findStuckCheckouts(now), summary, "checkoutsRetried", (payment) => this.retryCheckout(payment));
    await this.each(await this.findHeldBookings(now), summary, "holdsExpired", (id) => this.expireHold(id, now));
    await this.each(await this.findLateAcceptances(now), summary, "bookingsExpired", (id) => this.deps.bookingTransitions.expireAcceptance(id, now));
    await this.each(await this.findRequestedRefunds(), summary, "refundsReconciled", (payment) => this.reconcileRefund(payment, now));
    return summary;
  }

  private async each<T>(items: T[], summary: SweepSummary, counter: Counter, work: (item: T) => Promise<boolean>): Promise<void> {
    for (const item of items) {
      try {
        if (await work(item)) summary[counter] += 1;
      } catch (error) {
        summary.failed += 1;
        this.deps.logger.error({ counter, errorType: error instanceof Error ? error.name : typeof error }, "Sweep item failed");
      }
    }
  }

  private findStuckCheckouts(now: Date): Promise<IPayment[]> {
    return this.deps.em.find(
      Payment,
      {
        status: "creating",
        createdAt: { $lte: new Date(now.getTime() - CHECKOUT_RETRY_AFTER_MINUTES * MINUTE_MS) },
        // Past the hold the expire step owns the booking.
        booking: { status: "pending_payment", holdExpiresAt: { $gt: now } },
      },
      { populate: ["booking", "booking.mentee"], limit: SWEEP_BATCH_SIZE },
    );
  }

  private async findHeldBookings(now: Date): Promise<string[]> {
    const bookings = await this.deps.em.find(Booking, { status: "pending_payment", holdExpiresAt: { $lte: now } }, { limit: SWEEP_BATCH_SIZE });
    return bookings.map((booking) => booking.id);
  }

  private async findLateAcceptances(now: Date): Promise<string[]> {
    const bookings = await this.deps.em.find(Booking, { status: "awaiting_acceptance", acceptBy: { $lte: now } }, { limit: SWEEP_BATCH_SIZE });
    return bookings.map((booking) => booking.id);
  }

  private findRequestedRefunds(): Promise<IPayment[]> {
    return this.deps.em.find(Payment, { status: "refund_requested" }, { limit: SWEEP_BATCH_SIZE });
  }

  /** Same idempotency key as the first attempt, so a session that did get created is returned, not duplicated. */
  private async retryCheckout(payment: IPayment): Promise<boolean> {
    const booking = payment.booking;
    const returnUrl = new URL(`/bookings/${booking.id}`, this.deps.env.APP_URL).toString();
    const session = await this.deps.paymentGateway.createCheckout({
      bookingId: booking.id,
      customerEmail: booking.mentee.email,
      amount: payment.amount,
      currency: payment.currency,
      description: `DevMentor session, ${booking.lengthMinutes} min`,
      successUrl: returnUrl,
      cancelUrl: returnUrl,
      expiresAt: new Date(booking.holdExpiresAt.getTime() - CHECKOUT_MARGIN_MINUTES * MINUTE_MS),
      idempotencyKey: payment.checkoutIdempotencyKey,
    });
    // Conditional: the original request may have finished in the meantime.
    const updated = await this.deps.em.nativeUpdate(
      Payment,
      { id: payment.id, status: "creating" },
      { status: "open", checkoutSessionId: session.sessionId },
    );
    return updated > 0;
  }

  /** The expire protocol: ask the provider first, release the slot only when the session cannot be paid any more. */
  private async expireHold(bookingId: string, now: Date): Promise<boolean> {
    const payment = await this.deps.em.findOne(Payment, { booking: bookingId });
    if (payment?.checkoutSessionId) {
      const checkout = await this.deps.paymentGateway.expireCheckout(payment.checkoutSessionId);
      if (checkout.state === "paid") {
        // Paid before the session closed: honour it instead of releasing the slot.
        await this.deps.bookingTransitions.handlePaymentEvent({
          type: "checkout.completed",
          sessionId: payment.checkoutSessionId,
          bookingId,
          paymentStatus: "paid",
          amountTotal: payment.amount,
          currency: payment.currency,
          paymentIntentId: checkout.paymentIntentId,
        });
        this.deps.logger.info({ bookingId }, "Hold passed but the session was paid, payment applied");
        return false;
      }
    }
    return this.deps.bookingTransitions.expirePayment(bookingId, now);
  }

  /**
   * Calls the provider outside any transaction, then records the outcome under a row lock. Never trusts `refund()`'s
   * return value alone: it lists the intent's refunds first (a prior refund may already have succeeded under a since-pruned
   * idempotency key) and, after creating one, only finalizes once the provider reports it `succeeded`. A still-`pending`
   * refund is left as `refund_requested` for the next sweep run or the provider's webhook to confirm. A provider failure
   * counts as `failed`.
   */
  private async reconcileRefund(payment: IPayment, now: Date): Promise<boolean> {
    const bookingId = payment.booking.id;
    let refundId: string | null = null;
    let failureWithoutRefundId = false;
    let pending = false;
    let failedRefundIds: string[] = [];
    let lastError = "";
    try {
      if (!payment.paymentIntentId) throw new Error("Payment has no payment intent");
      const existing = await this.deps.paymentGateway.listRefunds(payment.paymentIntentId);
      const succeeded = existing.find((refund) => refund.status === "succeeded");
      failedRefundIds = existing.filter((refund) => refund.status === "failed").map((refund) => refund.id);
      if (failedRefundIds.length > 0) lastError = "Refund attempt failed: provider reports a failed refund";
      if (succeeded) {
        refundId = succeeded.id;
      } else if (existing.some((refund) => refund.status === "pending")) {
        // A refund is already in flight; creating another one can over-refund after the provider's idempotency window.
        pending = true;
      } else {
        const newRefundId = await this.deps.paymentGateway.refund({
          paymentIntentId: payment.paymentIntentId,
          amount: payment.amount,
          idempotencyKey: `refund:${bookingId}`,
        });
        const after = await this.deps.paymentGateway.listRefunds(payment.paymentIntentId);
        failedRefundIds.push(...after.filter((refund) => refund.status === "failed").map((refund) => refund.id));
        const afterSucceeded = after.find((refund) => refund.status === "succeeded");
        if (afterSucceeded) refundId = afterSucceeded.id;
        const created = after.find((refund) => refund.id === newRefundId);
        if (created?.status === "failed") {
          lastError = "Refund attempt failed: provider reported the refund failed".slice(0, LAST_ERROR_MAX_LENGTH);
        }
        pending = !refundId && after.some((refund) => refund.status === "pending");
        // Still pending: neither refunded nor a counted attempt — the webhook or a later sweep run settles it.
      }
    } catch (error) {
      failureWithoutRefundId = true;
      // The error's type only: a provider message can carry request details.
      lastError = `Refund attempt failed: ${error instanceof Error ? error.name : "unknown error"}`.slice(0, LAST_ERROR_MAX_LENGTH);
    }

    const outcome = await this.deps.em.transactional(async (em): Promise<"refunded" | "failed" | "skipped"> => {
      const current = await em.findOne(Payment, { id: payment.id }, { lockMode: LockMode.PESSIMISTIC_WRITE });
      if (!current || current.status !== "refund_requested") return "skipped";
      const newRefundFailures = recordRefundFailures(current, failedRefundIds);
      if (refundId) {
        current.status = "refunded";
        current.refundId = refundId;
        current.refundedAt = now;
        current.lastError = null;
        await em.flush();
        return "refunded";
      }
      if (failureWithoutRefundId) current.refundAttempts += 1;
      if (newRefundFailures === 0 && !failureWithoutRefundId) return "skipped";
      current.lastError = lastError;
      if (!pending && current.refundAttempts >= MAX_REFUND_ATTEMPTS) {
        current.status = "refund_failed";
        this.deps.logger.error({ bookingId, refundAttempts: current.refundAttempts }, "Refund failed after the maximum attempts");
      }
      await em.flush();
      return "failed";
    });
    // Thrown after the commit, so the attempt count survives.
    if (outcome === "failed") throw new Error(lastError);
    return outcome === "refunded";
  }
}
