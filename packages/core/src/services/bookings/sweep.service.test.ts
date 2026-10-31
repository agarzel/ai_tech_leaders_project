import { beforeEach, describe, expect, it, vi } from "vitest";
import { Booking, LockMode, Payment, type EntityManager } from "@devmentor/db";
import type { Env } from "../../config/env";
import { PaymentUnavailableError } from "../../http/errors";
import type { Logger } from "../../logger";
import type { PaymentGateway } from "../../payments/payment-gateway";
import { FakeClock } from "../../testing/fake-clock";
import type { BookingTransitions } from "./booking-transitions.service";
import { MAX_REFUND_ATTEMPTS, SweepService } from "./sweep.service";

const MINUTE = 60_000;
const NOW = new Date("2026-06-01T08:00:00Z");

type Row = Record<string, unknown>;

function setup(
  rows: { stuck?: Row[]; held?: Row[]; late?: Row[]; refunds?: Row[]; paymentOf?: Record<string, Row | null> } = {},
) {
  const find = vi.fn(async (entity: unknown, where: Row) => {
    if (entity === Payment) return where.status === "creating" ? (rows.stuck ?? []) : (rows.refunds ?? []);
    return where.status === "pending_payment" ? (rows.held ?? []) : (rows.late ?? []);
  });
  const findOne = vi.fn(async (entity: unknown, where: Row) => {
    if (entity === Payment && "booking" in where) return rows.paymentOf?.[where.booking as string] ?? null;
    return null;
  });
  const nativeUpdate = vi.fn().mockResolvedValue(1);
  const locked = new Map<string, Row>();
  const tx = {
    findOne: vi.fn(async (_entity: unknown, where: Row) => locked.get(where.id as string) ?? null),
    flush: vi.fn().mockResolvedValue(undefined),
  };
  const em = { find, findOne, nativeUpdate, transactional: vi.fn(async (work: (em: unknown) => unknown) => work(tx)) };
  const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const gateway = {
    createCheckout: vi.fn().mockResolvedValue({ sessionId: "cs_new", url: "https://pay.test/cs_new" }),
    expireCheckout: vi.fn().mockResolvedValue({ state: "expired" }),
    refund: vi.fn().mockResolvedValue("re_1"),
    // Pre-check finds nothing, post-check confirms the fresh refund succeeded: the default "happy path".
    listRefunds: vi.fn().mockResolvedValueOnce([]).mockResolvedValue([{ id: "re_1", status: "succeeded" }]),
  };
  const transitions = {
    expirePayment: vi.fn().mockResolvedValue(true),
    expireAcceptance: vi.fn().mockResolvedValue(true),
    handlePaymentEvent: vi.fn().mockResolvedValue(undefined),
  };
  const service = new SweepService({
    em: em as unknown as EntityManager,
    clock: new FakeClock(NOW),
    env: { APP_URL: "https://devmentor.test" } as unknown as Env,
    logger: logger as unknown as Logger,
    paymentGateway: gateway as unknown as PaymentGateway,
    bookingTransitions: transitions as unknown as BookingTransitions,
  });
  return { em, tx, locked, logger, gateway, transitions, service };
}

const stuckPayment = (): Row => ({
  id: "pay1",
  status: "creating",
  amount: 15_000,
  currency: "PLN",
  checkoutIdempotencyKey: "checkout:b1",
  booking: { id: "b1", lengthMinutes: 60, holdExpiresAt: new Date(NOW.getTime() + 20 * MINUTE) },
});

const refundPayment = (id = "pay1", bookingId = "b1"): Row => ({
  id,
  status: "refund_requested",
  amount: 15_000,
  paymentIntentId: `pi_${id}`,
  refundAttempts: 0,
  refundId: null,
  refundedAt: null,
  lastError: null,
  booking: { id: bookingId },
});

let ctx: ReturnType<typeof setup>;

beforeEach(() => {
  ctx = setup();
});

describe("SweepService.run: checkout retry", () => {
  it("creates the session again with the same idempotency key and moves the payment to open", async () => {
    ctx = setup({ stuck: [stuckPayment()] });

    const summary = await ctx.service.run(NOW);

    expect(ctx.gateway.createCheckout).toHaveBeenCalledWith({
      bookingId: "b1",
      amount: 15_000,
      currency: "PLN",
      description: "DevMentor session, 60 min",
      successUrl: "https://devmentor.test/bookings/b1",
      cancelUrl: "https://devmentor.test/bookings/b1",
      expiresAt: new Date(NOW.getTime() + 19 * MINUTE),
      idempotencyKey: "checkout:b1",
    });
    expect(ctx.em.nativeUpdate).toHaveBeenCalledWith(
      Payment,
      { id: "pay1", status: "creating" },
      { status: "open", checkoutSessionId: "cs_new" },
    );
    expect(summary.checkoutsRetried).toBe(1);
  });

  it("selects only payments stuck for two minutes whose hold has not passed", async () => {
    await ctx.service.run(NOW);

    expect(ctx.em.find).toHaveBeenCalledWith(
      Payment,
      {
        status: "creating",
        createdAt: { $lte: new Date(NOW.getTime() - 2 * MINUTE) },
        booking: { status: "pending_payment", holdExpiresAt: { $gt: NOW } },
      },
      { populate: ["booking"], limit: 100 },
    );
  });

  it("does not count a payment the original request already opened", async () => {
    ctx = setup({ stuck: [stuckPayment()] });
    ctx.em.nativeUpdate.mockResolvedValue(0);

    expect((await ctx.service.run(NOW)).checkoutsRetried).toBe(0);
  });

  it("counts a provider failure and leaves the payment creating", async () => {
    ctx = setup({ stuck: [stuckPayment()] });
    ctx.gateway.createCheckout.mockRejectedValue(new PaymentUnavailableError());

    const summary = await ctx.service.run(NOW);

    expect(summary).toMatchObject({ checkoutsRetried: 0, failed: 1 });
    expect(ctx.em.nativeUpdate).not.toHaveBeenCalled();
  });
});

describe("SweepService.run: expire the hold", () => {
  it("closes the session first, then expires the booking", async () => {
    ctx = setup({ held: [{ id: "b1" }], paymentOf: { b1: { checkoutSessionId: "cs_1", amount: 15_000, currency: "PLN" } } });

    const summary = await ctx.service.run(NOW);

    expect(ctx.gateway.expireCheckout).toHaveBeenCalledWith("cs_1");
    expect(ctx.transitions.expirePayment).toHaveBeenCalledWith("b1", NOW);
    expect(ctx.gateway.expireCheckout.mock.invocationCallOrder[0]).toBeLessThan(ctx.transitions.expirePayment.mock.invocationCallOrder[0]);
    expect(summary.holdsExpired).toBe(1);
  });

  it("expires a booking whose Checkout was never created without asking the provider", async () => {
    ctx = setup({ held: [{ id: "b1" }], paymentOf: { b1: { checkoutSessionId: null } } });

    const summary = await ctx.service.run(NOW);

    expect(ctx.gateway.expireCheckout).not.toHaveBeenCalled();
    expect(summary.holdsExpired).toBe(1);
  });

  it("expires a booking that has no payment row", async () => {
    ctx = setup({ held: [{ id: "b1" }] });

    expect((await ctx.service.run(NOW)).holdsExpired).toBe(1);
    expect(ctx.gateway.expireCheckout).not.toHaveBeenCalled();
  });

  it("applies the payment instead of releasing the slot when the session was paid", async () => {
    ctx = setup({ held: [{ id: "b1" }], paymentOf: { b1: { checkoutSessionId: "cs_1", amount: 15_000, currency: "PLN" } } });
    ctx.gateway.expireCheckout.mockResolvedValue({ state: "paid", paymentIntentId: "pi_1" });

    const summary = await ctx.service.run(NOW);

    expect(ctx.transitions.handlePaymentEvent).toHaveBeenCalledWith({
      type: "checkout.completed",
      sessionId: "cs_1",
      bookingId: "b1",
      paymentStatus: "paid",
      amountTotal: 15_000,
      currency: "PLN",
      paymentIntentId: "pi_1",
    });
    expect(ctx.transitions.expirePayment).not.toHaveBeenCalled();
    expect(summary.holdsExpired).toBe(0);
  });

  it("does not count a booking another actor already moved on", async () => {
    ctx = setup({ held: [{ id: "b1" }] });
    ctx.transitions.expirePayment.mockResolvedValue(false);

    expect((await ctx.service.run(NOW)).holdsExpired).toBe(0);
  });

  it("does not release the slot when the provider cannot close the session", async () => {
    ctx = setup({ held: [{ id: "b1" }], paymentOf: { b1: { checkoutSessionId: "cs_1" } } });
    ctx.gateway.expireCheckout.mockRejectedValue(new PaymentUnavailableError());

    const summary = await ctx.service.run(NOW);

    expect(ctx.transitions.expirePayment).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ holdsExpired: 0, failed: 1 });
  });
});

describe("SweepService.run: acceptance deadline", () => {
  it("expires bookings past acceptBy", async () => {
    ctx = setup({ late: [{ id: "b2" }, { id: "b3" }] });

    const summary = await ctx.service.run(NOW);

    expect(ctx.transitions.expireAcceptance).toHaveBeenCalledWith("b2", NOW);
    expect(ctx.transitions.expireAcceptance).toHaveBeenCalledWith("b3", NOW);
    expect(summary.bookingsExpired).toBe(2);
  });

  it("selects awaiting bookings whose deadline has passed", async () => {
    await ctx.service.run(NOW);

    expect(ctx.em.find).toHaveBeenCalledWith(Booking, { status: "awaiting_acceptance", acceptBy: { $lte: NOW } }, { limit: 100 });
  });
});

describe("SweepService.run: refund reconciliation", () => {
  it("refunds in full with the booking's key and records the refund", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);

    const summary = await ctx.service.run(NOW);

    expect(ctx.gateway.refund).toHaveBeenCalledWith({ paymentIntentId: "pi_pay1", amount: 15_000, idempotencyKey: "refund:b1" });
    expect(payment).toMatchObject({ status: "refunded", refundId: "re_1", refundedAt: NOW, lastError: null });
    expect(ctx.tx.findOne).toHaveBeenCalledWith(Payment, { id: "pay1" }, { lockMode: LockMode.PESSIMISTIC_WRITE });
    expect(summary.refundsReconciled).toBe(1);
  });

  it("calls the provider outside the transaction", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);

    await ctx.service.run(NOW);

    expect(ctx.gateway.refund.mock.invocationCallOrder[0]).toBeLessThan(ctx.em.transactional.mock.invocationCallOrder[0]);
  });

  it("finds an already-succeeded refund under a pruned idempotency key and never creates a new one", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.listRefunds.mockReset().mockResolvedValue([{ id: "re_prior", status: "succeeded" }]);

    const summary = await ctx.service.run(NOW);

    expect(ctx.gateway.refund).not.toHaveBeenCalled();
    expect(payment).toMatchObject({ status: "refunded", refundId: "re_prior", refundedAt: NOW });
    expect(summary.refundsReconciled).toBe(1);
  });

  it("leaves the payment as refund_requested while a fresh refund is still pending at the provider", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.listRefunds.mockReset().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "re_1", status: "pending" }]);

    const summary = await ctx.service.run(NOW);

    expect(ctx.gateway.refund).toHaveBeenCalled();
    expect(payment).toMatchObject({ status: "refund_requested", refundAttempts: 0, refundId: null });
    expect(ctx.tx.flush).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ refundsReconciled: 0, failed: 0 });
  });

  it("counts an attempt when the provider confirms the fresh refund failed outright", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.listRefunds.mockReset().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "re_1", status: "failed" }]);

    const summary = await ctx.service.run(NOW);

    expect(payment).toMatchObject({ status: "refund_requested", refundAttempts: 1, refundId: null });
    expect(summary).toMatchObject({ refundsReconciled: 0, failed: 1 });
  });

  it("counts an attempt and stores a short error that carries no provider detail when the refund fails", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.refund.mockRejectedValue(new PaymentUnavailableError("sk_live_secret and details"));

    const summary = await ctx.service.run(NOW);

    expect(payment).toMatchObject({ status: "refund_requested", refundAttempts: 1, refundId: null });
    expect(payment.lastError).toBe("Refund attempt failed: PaymentUnavailableError");
    expect(String(payment.lastError)).not.toContain("sk_live_secret");
    expect(ctx.tx.flush).toHaveBeenCalledTimes(1);
    expect(summary).toMatchObject({ refundsReconciled: 0, failed: 1 });
  });

  it("stores a generic error for a thrown non-Error value", async () => {
    const payment = refundPayment();
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.refund.mockRejectedValue("boom");

    await ctx.service.run(NOW);

    expect(payment.lastError).toBe("Refund attempt failed: unknown error");
  });

  it("fails an attempt for a payment without a payment intent and never calls the provider", async () => {
    const payment = { ...refundPayment(), paymentIntentId: null };
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);

    await ctx.service.run(NOW);

    expect(ctx.gateway.refund).not.toHaveBeenCalled();
    expect(payment).toMatchObject({ refundAttempts: 1, lastError: "Refund attempt failed: Error" });
  });

  it("marks refund_failed and logs an error after the maximum attempts", async () => {
    const payment = { ...refundPayment(), refundAttempts: MAX_REFUND_ATTEMPTS - 1 };
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.refund.mockRejectedValue(new PaymentUnavailableError());

    await ctx.service.run(NOW);

    expect(MAX_REFUND_ATTEMPTS).toBe(3);
    expect(payment).toMatchObject({ status: "refund_failed", refundAttempts: 3 });
    expect(ctx.logger.error).toHaveBeenCalledWith({ bookingId: "b1", refundAttempts: 3 }, "Refund failed after the maximum attempts");
  });

  it("keeps retrying below the maximum", async () => {
    const payment = { ...refundPayment(), refundAttempts: MAX_REFUND_ATTEMPTS - 2 };
    ctx = setup({ refunds: [payment] });
    ctx.locked.set("pay1", payment);
    ctx.gateway.refund.mockRejectedValue(new PaymentUnavailableError());

    await ctx.service.run(NOW);

    expect(payment).toMatchObject({ status: "refund_requested", refundAttempts: 2 });
  });

  it("changes nothing when the payment moved on while the provider was called", async () => {
    const payment = { ...refundPayment(), status: "refunded" };
    ctx = setup({ refunds: [refundPayment()] });
    ctx.locked.set("pay1", payment);

    const summary = await ctx.service.run(NOW);

    expect(payment).toMatchObject({ status: "refunded", refundId: null });
    expect(ctx.tx.flush).not.toHaveBeenCalled();
    expect(summary).toMatchObject({ refundsReconciled: 0, failed: 0 });
  });

  it("changes nothing when the payment row is gone", async () => {
    ctx = setup({ refunds: [refundPayment()] });

    expect((await ctx.service.run(NOW)).refundsReconciled).toBe(0);
  });
});

describe("SweepService.run: summary and isolation", () => {
  it("does nothing and reports zeros when there is no work, so a repeat run changes nothing", async () => {
    const first = await ctx.service.run(NOW);
    const second = await ctx.service.run(NOW);

    const zeros = { checkoutsRetried: 0, holdsExpired: 0, bookingsExpired: 0, refundsReconciled: 0, failed: 0 };
    expect(first).toEqual(zeros);
    expect(second).toEqual(zeros);
    expect(ctx.gateway.createCheckout).not.toHaveBeenCalled();
    expect(ctx.gateway.refund).not.toHaveBeenCalled();
  });

  it("runs the steps in order: checkout retry, hold expiry, acceptance expiry, refunds", async () => {
    const payment = refundPayment();
    ctx = setup({ stuck: [stuckPayment()], held: [{ id: "b1" }], late: [{ id: "b2" }], refunds: [payment] });
    ctx.locked.set("pay1", payment);

    await ctx.service.run(NOW);

    const order = [
      ctx.gateway.createCheckout.mock.invocationCallOrder[0],
      ctx.transitions.expirePayment.mock.invocationCallOrder[0],
      ctx.transitions.expireAcceptance.mock.invocationCallOrder[0],
      ctx.gateway.refund.mock.invocationCallOrder[0],
    ];
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("keeps going after one booking fails and counts it", async () => {
    ctx = setup({ late: [{ id: "bad" }, { id: "good" }] });
    ctx.transitions.expireAcceptance.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce(true);

    const summary = await ctx.service.run(NOW);

    expect(summary).toMatchObject({ bookingsExpired: 1, failed: 1 });
    expect(ctx.logger.error).toHaveBeenCalledWith({ counter: "bookingsExpired", errorType: "Error" }, "Sweep item failed");
  });

  it("logs the type of a thrown non-Error value", async () => {
    ctx = setup({ late: [{ id: "bad" }] });
    ctx.transitions.expireAcceptance.mockRejectedValue("boom");

    await ctx.service.run(NOW);

    expect(ctx.logger.error).toHaveBeenCalledWith({ counter: "bookingsExpired", errorType: "string" }, "Sweep item failed");
  });

  it("uses the clock when no time is passed", async () => {
    ctx = setup({ late: [{ id: "b2" }] });

    await ctx.service.run();

    expect(ctx.transitions.expireAcceptance).toHaveBeenCalledWith("b2", NOW);
  });
});
