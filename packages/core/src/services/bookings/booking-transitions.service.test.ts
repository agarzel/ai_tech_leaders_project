import { beforeEach, describe, expect, it, vi } from "vitest";
import { Booking, LockMode, MentorProfile, Payment, Slot, type EntityManager } from "@devmentor/db";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import type { Logger } from "../../logger";
import type { PaymentEvent } from "../../payments/payment-gateway";
import { FakeClock } from "../../testing/fake-clock";
import type { SlotService } from "../availability/slot.service";
import { ACCEPTANCE_LEAD_HOURS, BookingTransitions } from "./booking-transitions.service";
import { MAX_REFUND_ATTEMPTS } from "./sweep.service";

const HOUR = 3_600_000;
const NOW = new Date("2026-06-01T08:00:00Z");
const STARTS_AT = new Date(NOW.getTime() + 48 * HOUR);

const paidEvent: PaymentEvent = {
  type: "checkout.completed",
  sessionId: "cs_1",
  bookingId: "b1",
  paymentStatus: "paid",
  amountTotal: 15_000,
  currency: "pln",
  paymentIntentId: "pi_1",
};

function setup(overrides: { booking?: Record<string, unknown>; payment?: Record<string, unknown>; slot?: Record<string, unknown> } = {}) {
  const booking: Record<string, unknown> = {
    id: "b1",
    status: "pending_payment",
    holdExpiresAt: new Date(NOW.getTime() + 10 * 60_000),
    acceptBy: null,
    decidedAt: null,
    declineReason: null,
    slot: { id: "s1" },
    mentor: { id: "p1" },
    ...overrides.booking,
  };
  const payment: Record<string, unknown> = {
    id: "pay1",
    status: "open",
    amount: 15_000,
    currency: "PLN",
    checkoutSessionId: "cs_1",
    paymentIntentId: null,
    refundAttempts: 0,
    refundFailureIds: [],
    paidAt: null,
    booking: { id: "b1" },
    ...overrides.payment,
  };
  const slot = { id: "s1", startsAt: STARTS_AT, ...overrides.slot };
  const tx = {
    findOne: vi.fn(async (entity: unknown) => (entity === Booking ? booking : entity === Payment ? payment : null)),
    findOneOrFail: vi.fn(async (entity: unknown) => (entity === Booking ? booking : entity === Payment ? payment : slot)),
    count: vi.fn().mockResolvedValue(1),
    flush: vi.fn().mockResolvedValue(undefined),
  };
  const em = {
    findOne: vi.fn(async (entity: unknown) => (entity === Payment ? payment : null)),
    transactional: vi.fn(async (work: (em: unknown) => unknown) => work(tx)),
  };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const slotService = { release: vi.fn().mockResolvedValue(undefined) };
  const service = new BookingTransitions({
    em: em as unknown as EntityManager,
    clock: new FakeClock(NOW),
    logger: logger as unknown as Logger,
    slotService: slotService as unknown as SlotService,
  });
  return { booking, payment, slot, tx, em, logger, slotService, service };
}

let ctx: ReturnType<typeof setup>;

beforeEach(() => {
  ctx = setup();
});

describe("BookingTransitions.handlePaymentEvent", () => {
  it("moves a pending booking to awaiting_acceptance and the payment to paid", async () => {
    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.booking.status).toBe("awaiting_acceptance");
    expect(ctx.payment).toMatchObject({ status: "paid", paymentIntentId: "pi_1", paidAt: NOW });
    expect(ctx.tx.flush).toHaveBeenCalledTimes(1);
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it("sets acceptBy to 12 hours before the session starts", async () => {
    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ACCEPTANCE_LEAD_HOURS).toBe(12);
    expect(ctx.booking.acceptBy).toEqual(new Date(STARTS_AT.getTime() - 12 * HOUR));
  });

  it("locks the booking row before reading the payment", async () => {
    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.tx.findOneOrFail).toHaveBeenNthCalledWith(1, Booking, { id: "b1" }, { lockMode: LockMode.PESSIMISTIC_WRITE });
    expect(ctx.tx.findOneOrFail).toHaveBeenNthCalledWith(2, Payment, { booking: "b1" });
  });

  it("honours a payment that completed after the hold passed while the slot is still held", async () => {
    ctx = setup({ booking: { holdExpiresAt: new Date(NOW.getTime() - 60_000) } });

    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.booking.status).toBe("awaiting_acceptance");
  });

  it.each(["paid", "refund_requested", "refunded", "refund_failed"])("does nothing for a repeated event when the payment is %s", async (status) => {
    ctx = setup({ payment: { status } });

    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.booking.status).toBe("pending_payment");
    expect(ctx.tx.flush).not.toHaveBeenCalled();
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it("requests a full refund instead of a booking when the payment arrives after the booking expired", async () => {
    ctx = setup({ booking: { status: "payment_expired" }, payment: { status: "expired" } });

    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.booking.status).toBe("payment_expired");
    expect(ctx.payment).toMatchObject({ status: "refund_requested", paymentIntentId: "pi_1", paidAt: NOW });
    expect(ctx.booking.acceptBy).toBeNull();
  });

  it("asks the slot to release after a late payment, which is a no-op while another booking holds it", async () => {
    ctx = setup({ booking: { status: "payment_expired" }, payment: { status: "expired" } });

    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("refunds a payment made too late for the mentor to decide and frees the slot", async () => {
    ctx = setup({ slot: { startsAt: new Date(NOW.getTime() + 12 * HOUR) } });

    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.booking.status).toBe("payment_expired");
    expect(ctx.booking.acceptBy).toBeNull();
    expect(ctx.payment.status).toBe("refund_requested");
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("ignores an unknown checkout session and logs the reason", async () => {
    ctx.em.findOne.mockResolvedValue(null);

    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.em.transactional).not.toHaveBeenCalled();
    expect(ctx.logger.warn).toHaveBeenCalledWith({ sessionId: "cs_1" }, "Payment event ignored: unknown checkout session");
  });

  it("ignores a completed checkout that is not paid", async () => {
    await ctx.service.handlePaymentEvent({ ...paidEvent, paymentStatus: "unpaid" } as PaymentEvent);

    expect(ctx.em.findOne).not.toHaveBeenCalled();
    expect(ctx.em.transactional).not.toHaveBeenCalled();
    expect(ctx.logger.warn).toHaveBeenCalled();
  });

  it("ignores event types it does not handle", async () => {
    await ctx.service.handlePaymentEvent({ type: "ignored", providerType: "customer.created" });

    expect(ctx.em.transactional).not.toHaveBeenCalled();
    expect(ctx.logger.info).toHaveBeenCalledWith({ providerType: "customer.created" }, "Payment event ignored: type not handled");
  });

  it.each([
    ["booking id", { bookingId: "other" }],
    ["booking id (missing)", { bookingId: null }],
    ["amount", { amountTotal: 100 }],
    ["amount (missing)", { amountTotal: null }],
    ["currency", { currency: "eur" }],
    ["currency (missing)", { currency: null }],
  ])("logs an error and changes nothing when the %s does not match", async (_name, patch) => {
    await ctx.service.handlePaymentEvent({ ...paidEvent, ...patch } as PaymentEvent);

    expect(ctx.booking.status).toBe("pending_payment");
    expect(ctx.payment.status).toBe("open");
    expect(ctx.tx.flush).not.toHaveBeenCalled();
    expect(ctx.logger.error).toHaveBeenCalledWith({ sessionId: "cs_1", bookingId: "b1" }, "Paid event does not match the booking, no transition");
  });
});

describe("BookingTransitions.handlePaymentEvent: refund outcome", () => {
  it("marks the payment refunded when a refund.updated webhook confirms success", async () => {
    ctx = setup({ payment: { status: "refund_requested", paymentIntentId: "pi_1", refundAttempts: 0 } });

    await ctx.service.handlePaymentEvent({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "succeeded" });

    expect(ctx.payment).toMatchObject({ status: "refunded", refundId: "re_1", refundedAt: NOW, lastError: null });
    expect(ctx.tx.findOne).toHaveBeenCalledWith(Payment, { paymentIntentId: "pi_1" }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  });

  it("counts a failed attempt and marks refund_failed after the maximum", async () => {
    ctx = setup({ payment: { status: "refund_requested", paymentIntentId: "pi_1", refundAttempts: MAX_REFUND_ATTEMPTS - 1 } });

    await ctx.service.handlePaymentEvent({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "failed" });

    expect(ctx.payment).toMatchObject({ status: "refund_failed", refundAttempts: MAX_REFUND_ATTEMPTS });
    expect(ctx.logger.error).toHaveBeenCalledWith({ paymentIntentId: "pi_1", refundAttempts: MAX_REFUND_ATTEMPTS }, "Refund failed after the maximum attempts");
  });

  it("counts a failed refund webhook only once for the same refund id", async () => {
    ctx = setup({ payment: { status: "refund_requested", paymentIntentId: "pi_1", refundAttempts: 0 } });
    const event: PaymentEvent = { type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "failed" };

    await ctx.service.handlePaymentEvent(event);
    await ctx.service.handlePaymentEvent(event);

    expect(ctx.payment).toMatchObject({ status: "refund_requested", refundAttempts: 1, refundFailureIds: ["re_1"] });
  });

  it("does not recount a failure already recorded by the sweep", async () => {
    ctx = setup({ payment: { status: "refund_requested", paymentIntentId: "pi_1", refundAttempts: 1, refundFailureIds: ["re_1"] } });

    await ctx.service.handlePaymentEvent({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "failed" });

    expect(ctx.payment).toMatchObject({ status: "refund_requested", refundAttempts: 1, refundFailureIds: ["re_1"] });
  });

  it("keeps retrying below the maximum", async () => {
    ctx = setup({ payment: { status: "refund_requested", paymentIntentId: "pi_1", refundAttempts: 0 } });

    await ctx.service.handlePaymentEvent({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "failed" });

    expect(ctx.payment).toMatchObject({ status: "refund_requested", refundAttempts: 1 });
  });

  it("ignores a refund webhook when no matching payment is found", async () => {
    ctx.tx.findOne.mockResolvedValueOnce(null);

    await ctx.service.handlePaymentEvent({ type: "refund.updated", paymentIntentId: "pi_missing", refundId: "re_1", status: "succeeded" });

    expect(ctx.tx.flush).not.toHaveBeenCalled();
  });

  it("does nothing for a refund webhook once the payment already settled", async () => {
    ctx = setup({ payment: { status: "refunded", paymentIntentId: "pi_1" } });

    await ctx.service.handlePaymentEvent({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "succeeded" });

    expect(ctx.payment.status).toBe("refunded");
    expect(ctx.tx.flush).not.toHaveBeenCalled();
  });
});

describe("BookingTransitions.accept", () => {
  const acceptBy = new Date(NOW.getTime() + 6 * HOUR);

  beforeEach(() => {
    ctx = setup({ booking: { status: "awaiting_acceptance", acceptBy } });
  });

  it("confirms the booking for its own mentor and records the decision time", async () => {
    await ctx.service.accept("u-mentor", "b1");

    expect(ctx.booking.status).toBe("confirmed");
    expect(ctx.booking.decidedAt).toEqual(NOW);
    expect(ctx.tx.count).toHaveBeenCalledWith(MentorProfile, { id: "p1", user: "u-mentor" });
    expect(ctx.tx.findOne).toHaveBeenCalledWith(Booking, { id: "b1" }, { lockMode: LockMode.PESSIMISTIC_WRITE });
  });

  it("refuses another mentor as if the booking did not exist", async () => {
    ctx.tx.count.mockResolvedValue(0);

    await expect(ctx.service.accept("u-other", "b1")).rejects.toBeInstanceOf(NotFoundError);
    expect(ctx.booking.status).toBe("awaiting_acceptance");
  });

  it("refuses a missing booking", async () => {
    ctx.tx.findOne.mockResolvedValue(null as never);

    await expect(ctx.service.accept("u-mentor", "nope")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("refuses a booking that is not awaiting acceptance", async () => {
    ctx.booking.status = "confirmed";

    await expect(ctx.service.accept("u-mentor", "b1")).rejects.toBeInstanceOf(ConflictError);
  });

  it("refuses at the deadline, even before the sweep ran", async () => {
    ctx.booking.acceptBy = NOW;

    await expect(ctx.service.accept("u-mentor", "b1")).rejects.toThrow("The acceptance deadline has passed");
    expect(ctx.booking.status).toBe("awaiting_acceptance");
  });

  it("refuses a booking with no deadline set", async () => {
    ctx.booking.acceptBy = null;

    await expect(ctx.service.accept("u-mentor", "b1")).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("BookingTransitions.decline", () => {
  beforeEach(() => {
    ctx = setup({
      booking: { status: "awaiting_acceptance", acceptBy: new Date(NOW.getTime() + 6 * HOUR) },
      payment: { status: "paid" },
    });
  });

  it("declines, stores the reason and requests the refund", async () => {
    await ctx.service.decline("u-mentor", "b1", "  Not my area  ");

    expect(ctx.booking).toMatchObject({ status: "declined", decidedAt: NOW, declineReason: "Not my area" });
    expect(ctx.payment.status).toBe("refund_requested");
  });

  it("stores no reason when none is given", async () => {
    await ctx.service.decline("u-mentor", "b1");

    expect(ctx.booking.declineReason).toBeNull();
  });

  it("releases the slot only after the booking left the live statuses", async () => {
    const order: string[] = [];
    ctx.tx.flush.mockImplementation(async () => {
      order.push(`flush:${String(ctx.booking.status)}`);
    });
    ctx.slotService.release.mockImplementation(async () => {
      order.push("release");
    });

    await ctx.service.decline("u-mentor", "b1");

    expect(order).toEqual(["flush:declined", "release"]);
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("refuses a reason over 280 characters before touching the database", async () => {
    await expect(ctx.service.decline("u-mentor", "b1", "a".repeat(281))).rejects.toBeInstanceOf(ValidationError);
    expect(ctx.em.transactional).not.toHaveBeenCalled();
  });

  it("refuses another mentor and releases nothing", async () => {
    ctx.tx.count.mockResolvedValue(0);

    await expect(ctx.service.decline("u-other", "b1")).rejects.toBeInstanceOf(NotFoundError);
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it("refuses a booking that is already decided", async () => {
    ctx.booking.status = "declined";

    await expect(ctx.service.decline("u-mentor", "b1")).rejects.toBeInstanceOf(ConflictError);
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it("leaves a payment that is not paid alone", async () => {
    ctx.payment.status = "expired";

    await ctx.service.decline("u-mentor", "b1");

    expect(ctx.payment.status).toBe("expired");
  });

  it("copes with a booking that has no payment row", async () => {
    ctx.tx.findOne.mockImplementation(async (entity: unknown) => (entity === Booking ? ctx.booking : null));

    await ctx.service.decline("u-mentor", "b1");

    expect(ctx.booking.status).toBe("declined");
  });
});

describe("BookingTransitions.expireAcceptance", () => {
  beforeEach(() => {
    ctx = setup({
      booking: { status: "awaiting_acceptance", acceptBy: new Date(NOW.getTime() - 1000) },
      payment: { status: "paid" },
    });
  });

  it("expires the booking, requests the refund and releases the slot once the deadline passed", async () => {
    await expect(ctx.service.expireAcceptance("b1", NOW)).resolves.toBe(true);

    expect(ctx.booking.status).toBe("expired");
    expect(ctx.payment.status).toBe("refund_requested");
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("expires at exactly the deadline", async () => {
    ctx.booking.acceptBy = NOW;

    await expect(ctx.service.expireAcceptance("b1", NOW)).resolves.toBe(true);
  });

  it("changes nothing before the deadline", async () => {
    ctx.booking.acceptBy = new Date(NOW.getTime() + 1000);

    await expect(ctx.service.expireAcceptance("b1", NOW)).resolves.toBe(false);
    expect(ctx.booking.status).toBe("awaiting_acceptance");
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it.each(["pending_payment", "confirmed", "declined", "expired", "payment_expired"])("changes nothing for a %s booking", async (status) => {
    ctx.booking.status = status;

    await expect(ctx.service.expireAcceptance("b1", NOW)).resolves.toBe(false);
    expect(ctx.booking.status).toBe(status);
    expect(ctx.tx.flush).not.toHaveBeenCalled();
  });

  it("changes nothing for a booking without a deadline", async () => {
    ctx.booking.acceptBy = null;

    await expect(ctx.service.expireAcceptance("b1", NOW)).resolves.toBe(false);
  });

  it("changes nothing for a missing booking", async () => {
    ctx.tx.findOne.mockResolvedValue(null as never);

    await expect(ctx.service.expireAcceptance("nope", NOW)).resolves.toBe(false);
  });
});

describe("BookingTransitions.expirePayment", () => {
  beforeEach(() => {
    ctx = setup({ booking: { holdExpiresAt: new Date(NOW.getTime() - 1000) } });
  });

  it("expires the booking and the open payment and releases the slot once the hold passed", async () => {
    await expect(ctx.service.expirePayment("b1", NOW)).resolves.toBe(true);

    expect(ctx.booking.status).toBe("payment_expired");
    expect(ctx.payment.status).toBe("expired");
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("expires a payment that never got a session", async () => {
    ctx.payment.status = "creating";

    await ctx.service.expirePayment("b1", NOW);

    expect(ctx.payment.status).toBe("expired");
  });

  it("leaves a payment that is already beyond open alone", async () => {
    ctx.payment.status = "paid";

    await ctx.service.expirePayment("b1", NOW);

    expect(ctx.payment.status).toBe("paid");
  });

  it("copes with a booking that has no payment row", async () => {
    ctx.tx.findOne.mockImplementation(async (entity: unknown) => (entity === Booking ? ctx.booking : null));

    await expect(ctx.service.expirePayment("b1", NOW)).resolves.toBe(true);
  });

  it("changes nothing while the hold is still valid", async () => {
    ctx.booking.holdExpiresAt = new Date(NOW.getTime() + 1000);

    await expect(ctx.service.expirePayment("b1", NOW)).resolves.toBe(false);
    expect(ctx.booking.status).toBe("pending_payment");
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it("expires immediately after definite checkout failure even while the hold is valid", async () => {
    await expect(ctx.service.expirePayment("b1", NOW, "checkout-failed")).resolves.toBe(true);

    expect(ctx.booking.status).toBe("payment_expired");
    expect(ctx.payment.status).toBe("expired");
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it.each(["awaiting_acceptance", "confirmed", "declined", "expired", "payment_expired"])("changes nothing for a %s booking", async (status) => {
    ctx.booking.status = status;

    await expect(ctx.service.expirePayment("b1", NOW)).resolves.toBe(false);
    expect(ctx.booking.status).toBe(status);
    expect(ctx.tx.flush).not.toHaveBeenCalled();
  });

  it("changes nothing for a missing booking", async () => {
    ctx.tx.findOne.mockResolvedValue(null as never);

    await expect(ctx.service.expirePayment("nope", NOW)).resolves.toBe(false);
  });
});

describe("slot lookup", () => {
  it("reads the session start from the slot of the booking", async () => {
    await ctx.service.handlePaymentEvent(paidEvent);

    expect(ctx.tx.findOneOrFail).toHaveBeenCalledWith(Slot, { id: "s1" });
  });
});

describe("BookingTransitions.cancelByMentee", () => {
  const HOURS = (hours: number) => new Date(NOW.getTime() + hours * HOUR);
  const confirmed = (startsAt: Date, status = "confirmed") => ({
    status,
    mentee: { id: "mentee" },
    priceAmount: 15_000,
    slot: { id: "s1", startsAt },
  });

  it("refunds a cancellation made more than 12 hours before the start and frees the slot", async () => {
    const ctx = setup({ booking: confirmed(HOURS(48)), payment: { status: "paid" } });

    await expect(ctx.service.cancelByMentee("mentee", "b1")).resolves.toBe("refunded");

    expect(ctx.booking).toMatchObject({ status: "cancelled", cancelledAt: NOW, cancelReason: "mentee_free" });
    expect(ctx.payment.status).toBe("refund_requested");
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("keeps the payment for the mentor when cancelled less than 12 hours before the start", async () => {
    const ctx = setup({ booking: confirmed(HOURS(6)), payment: { status: "paid" } });

    await expect(ctx.service.cancelByMentee("mentee", "b1")).resolves.toBe("not_refunded");

    expect(ctx.booking).toMatchObject({ status: "cancelled", cancelReason: "mentee_late" });
    expect(ctx.payment).toMatchObject({ status: "paid", mentorShareAmount: 15_000 });
    expect(ctx.slotService.release).toHaveBeenCalledWith("s1");
  });

  it("does not request a refund for a payment that is not paid", async () => {
    const ctx = setup({ booking: confirmed(HOURS(48)), payment: { status: "open" } });

    await ctx.service.cancelByMentee("mentee", "b1");

    expect(ctx.payment.status).toBe("open");
  });

  it("cancels a booking that has no payment row without recording a share", async () => {
    const ctx = setup({ booking: confirmed(HOURS(6)) });
    ctx.tx.findOne.mockImplementation(async (entity: unknown) => (entity === Booking ? ctx.booking : null));

    await expect(ctx.service.cancelByMentee("mentee", "b1")).resolves.toBe("not_refunded");

    expect(ctx.booking.status).toBe("cancelled");
  });

  it("answers not_found for a booking that is not the caller's", async () => {
    const ctx = setup({ booking: confirmed(HOURS(48)) });

    await expect(ctx.service.cancelByMentee("someone-else", "b1")).rejects.toThrow(NotFoundError);
    expect(ctx.booking.status).toBe("confirmed");
  });

  it("answers not_found when the booking does not exist", async () => {
    const ctx = setup();
    ctx.tx.findOne.mockImplementation(async () => null);

    await expect(ctx.service.cancelByMentee("mentee", "missing")).rejects.toThrow(NotFoundError);
  });

  it("refuses a booking that is not confirmed", async () => {
    const ctx = setup({ booking: confirmed(HOURS(48), "awaiting_acceptance") });

    await expect(ctx.service.cancelByMentee("mentee", "b1")).rejects.toThrow(ConflictError);
    expect(ctx.slotService.release).not.toHaveBeenCalled();
  });

  it("refuses a cancellation once the session has started", async () => {
    const ctx = setup({ booking: confirmed(HOURS(-1)) });

    await expect(ctx.service.cancelByMentee("mentee", "b1")).rejects.toThrow(ConflictError);
    expect(ctx.booking.status).toBe("confirmed");
  });
});
