import { describe, expect, it, vi } from "vitest";
import { PaymentUnavailableError, ValidationError } from "../http/errors";
import type { CheckoutInput } from "./payment-gateway";
import { StripeGateway, type StripeClient } from "./stripe.gateway";

const input: CheckoutInput = {
  bookingId: "booking-1",
  amount: 15000,
  currency: "PLN",
  description: "Mentoring session",
  successUrl: "https://devmentor.test/bookings/booking-1",
  cancelUrl: "https://devmentor.test/mentors",
  expiresAt: new Date("2026-10-26T12:00:00Z"),
  idempotencyKey: "checkout:booking-1",
  customerEmail: "mentee@devmentor.test",
};

function setup() {
  const create = vi.fn();
  const constructEvent = vi.fn();
  const retrieve = vi.fn();
  const expire = vi.fn();
  const refundCreate = vi.fn();
  const refundList = vi.fn();
  const client = {
    checkout: { sessions: { create, retrieve, expire } },
    refunds: { create: refundCreate, list: refundList },
    webhooks: { constructEvent },
  } as unknown as StripeClient;
  return {
    create,
    constructEvent,
    retrieve,
    expire,
    refundCreate,
    refundList,
    gateway: new StripeGateway({ client, webhookSecret: "whsec_test" }),
  };
}

describe("StripeGateway.createCheckout", () => {
  it("creates a card-only payment session for the booking and returns its id and url", async () => {
    const { create, gateway } = setup();
    create.mockResolvedValue({ id: "cs_test_1", url: "https://checkout.stripe.com/cs_test_1" });

    const session = await gateway.createCheckout(input);

    expect(session).toEqual({ sessionId: "cs_test_1", url: "https://checkout.stripe.com/cs_test_1" });
    expect(create).toHaveBeenCalledWith(
      {
        mode: "payment",
        allowed_payment_method_types: ["card"],
        client_reference_id: "booking-1",
        metadata: { bookingId: "booking-1" },
        customer_email: "mentee@devmentor.test",
        line_items: [
          { quantity: 1, price_data: { currency: "pln", unit_amount: 15000, product_data: { name: "Mentoring session" } } },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        expires_at: Math.floor(input.expiresAt.getTime() / 1000),
      },
      { idempotencyKey: "checkout:booking-1" },
    );
  });

  it("maps a provider failure to PaymentUnavailableError without leaking the provider message", async () => {
    const { create, gateway } = setup();
    create.mockRejectedValue(new Error("secret provider detail"));

    const error = await gateway.createCheckout(input).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PaymentUnavailableError);
    expect((error as Error).message).not.toContain("secret provider detail");
  });

  it("maps a non-Error rejection to PaymentUnavailableError", async () => {
    const { create, gateway } = setup();
    create.mockRejectedValue("boom");

    await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(PaymentUnavailableError);
  });

  it("treats a session without a url as unavailable", async () => {
    const { create, gateway } = setup();
    create.mockResolvedValue({ id: "cs_test_1", url: null });

    await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(PaymentUnavailableError);
  });
});

describe("StripeGateway.parseWebhook", () => {
  const headers = new Headers({ "stripe-signature": "t=1,v1=abc" });

  it("verifies the signature with the webhook secret and maps a completed session", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_1",
          client_reference_id: "booking-1",
          payment_status: "paid",
          amount_total: 15000,
          currency: "pln",
          payment_intent: "pi_1",
        },
      },
    });

    const event = gateway.parseWebhook("{}", headers);

    expect(constructEvent).toHaveBeenCalledWith("{}", "t=1,v1=abc", "whsec_test");
    expect(event).toEqual({
      type: "checkout.completed",
      sessionId: "cs_test_1",
      bookingId: "booking-1",
      paymentStatus: "paid",
      amountTotal: 15000,
      currency: "pln",
      paymentIntentId: "pi_1",
    });
  });

  it("maps an expanded or missing payment intent to null", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs", client_reference_id: null, payment_status: "unpaid", amount_total: null, currency: null, payment_intent: { id: "pi" } } },
    });

    expect(gateway.parseWebhook("{}", headers)).toMatchObject({ bookingId: null, paymentIntentId: null });
  });

  it("ignores other event types", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({ type: "charge.succeeded" });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "ignored", providerType: "charge.succeeded" });
  });

  it("maps a refund.updated event reporting success", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "refund.updated",
      data: { object: { id: "re_1", payment_intent: "pi_1", status: "succeeded" } },
    });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "succeeded" });
  });

  it("maps a refund.updated event reporting a definite failure", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "refund.updated",
      data: { object: { id: "re_1", payment_intent: "pi_1", status: "failed" } },
    });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "failed" });
  });

  it("maps a canceled refund to a failure", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "refund.updated",
      data: { object: { id: "re_1", payment_intent: "pi_1", status: "canceled" } },
    });

    expect(gateway.parseWebhook("{}", headers)).toMatchObject({ status: "failed" });
  });

  it("ignores a refund.updated event that is still pending", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "refund.updated",
      data: { object: { id: "re_1", payment_intent: "pi_1", status: "pending" } },
    });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "ignored", providerType: "refund.updated" });
  });

  it("ignores a refund.updated event with an expanded or missing payment intent", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "refund.updated",
      data: { object: { id: "re_1", payment_intent: { id: "pi_1" }, status: "succeeded" } },
    });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "ignored", providerType: "refund.updated" });
  });

  it("maps a charge.refunded event from its latest refund", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: { object: { refunds: { data: [{ id: "re_1", payment_intent: "pi_1", status: "succeeded" }] } } },
    });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "refund.updated", paymentIntentId: "pi_1", refundId: "re_1", status: "succeeded" });
  });

  it("ignores a charge.refunded event that carries no refund", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockReturnValue({ type: "charge.refunded", data: { object: { refunds: { data: [] } } } });

    expect(gateway.parseWebhook("{}", headers)).toEqual({ type: "ignored", providerType: "charge.refunded" });
  });

  it("rejects a body whose signature does not verify", () => {
    const { constructEvent, gateway } = setup();
    constructEvent.mockImplementation(() => {
      throw new Error("No signatures found matching the expected signature");
    });

    expect(() => gateway.parseWebhook("{}", headers)).toThrow(ValidationError);
  });

  it("rejects a request without a signature header, without calling Stripe", () => {
    const { constructEvent, gateway } = setup();

    expect(() => gateway.parseWebhook("{}", new Headers())).toThrow(ValidationError);
    expect(constructEvent).not.toHaveBeenCalled();
  });
});

describe("StripeGateway.expireCheckout", () => {
  it("expires an open session", async () => {
    const { retrieve, expire, gateway } = setup();
    retrieve.mockResolvedValue({ status: "open" });

    await expect(gateway.expireCheckout("cs_1")).resolves.toEqual({ state: "expired" });
    expect(expire).toHaveBeenCalledWith("cs_1");
  });

  it("treats an already expired session as success without expiring it again", async () => {
    const { retrieve, expire, gateway } = setup();
    retrieve.mockResolvedValue({ status: "expired" });

    await expect(gateway.expireCheckout("cs_1")).resolves.toEqual({ state: "expired" });
    expect(expire).not.toHaveBeenCalled();
  });

  it("reports a completed paid session with its payment intent", async () => {
    const { retrieve, expire, gateway } = setup();
    retrieve.mockResolvedValue({ status: "complete", payment_status: "paid", payment_intent: "pi_1" });

    await expect(gateway.expireCheckout("cs_1")).resolves.toEqual({ state: "paid", paymentIntentId: "pi_1" });
    expect(expire).not.toHaveBeenCalled();
  });

  it("reports a null payment intent when the paid session carries none as a string", async () => {
    const { retrieve, gateway } = setup();
    retrieve.mockResolvedValue({ status: "complete", payment_status: "paid", payment_intent: null });

    await expect(gateway.expireCheckout("cs_1")).resolves.toEqual({ state: "paid", paymentIntentId: null });
  });

  it("refuses a completed session that is not paid", async () => {
    const { retrieve, gateway } = setup();
    retrieve.mockResolvedValue({ status: "complete", payment_status: "unpaid" });

    await expect(gateway.expireCheckout("cs_1")).rejects.toBeInstanceOf(PaymentUnavailableError);
  });

  it("maps a provider failure to PaymentUnavailableError without leaking the message", async () => {
    const { retrieve, gateway } = setup();
    retrieve.mockRejectedValue(new Error("secret provider detail"));

    const error = await gateway.expireCheckout("cs_1").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PaymentUnavailableError);
    expect((error as Error).message).not.toContain("secret provider detail");
  });

  it("maps a thrown non-Error value to PaymentUnavailableError", async () => {
    const { retrieve, gateway } = setup();
    retrieve.mockRejectedValue("boom");

    await expect(gateway.expireCheckout("cs_1")).rejects.toBeInstanceOf(PaymentUnavailableError);
  });
});

describe("StripeGateway.refund", () => {
  it("refunds the full amount with the idempotency key and returns the refund id", async () => {
    const { refundCreate, gateway } = setup();
    refundCreate.mockResolvedValue({ id: "re_1" });

    const id = await gateway.refund({ paymentIntentId: "pi_1", amount: 15000, idempotencyKey: "refund:booking-1" });

    expect(id).toBe("re_1");
    expect(refundCreate).toHaveBeenCalledWith({ payment_intent: "pi_1", amount: 15000 }, { idempotencyKey: "refund:booking-1" });
  });

  it("maps a provider failure to PaymentUnavailableError without leaking the message", async () => {
    const { refundCreate, gateway } = setup();
    refundCreate.mockRejectedValue(new Error("secret provider detail"));

    const error = await gateway.refund({ paymentIntentId: "pi_1", amount: 1, idempotencyKey: "k" }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PaymentUnavailableError);
    expect((error as Error).message).not.toContain("secret provider detail");
  });

  it("maps a thrown non-Error value to PaymentUnavailableError", async () => {
    const { refundCreate, gateway } = setup();
    refundCreate.mockRejectedValue("boom");

    await expect(gateway.refund({ paymentIntentId: "pi_1", amount: 1, idempotencyKey: "k" })).rejects.toBeInstanceOf(PaymentUnavailableError);
  });
});

describe("StripeGateway.listRefunds", () => {
  it("lists the refunds of a payment intent, mapping each status", async () => {
    const { refundList, gateway } = setup();
    refundList.mockResolvedValue({
      data: [
        { id: "re_1", status: "succeeded" },
        { id: "re_2", status: "failed" },
        { id: "re_3", status: "canceled" },
        { id: "re_4", status: "pending" },
      ],
    });

    const refunds = await gateway.listRefunds("pi_1");

    expect(refundList).toHaveBeenCalledWith({ payment_intent: "pi_1" });
    expect(refunds).toEqual([
      { id: "re_1", status: "succeeded" },
      { id: "re_2", status: "failed" },
      { id: "re_3", status: "failed" },
      { id: "re_4", status: "pending" },
    ]);
  });

  it("maps a provider failure to PaymentUnavailableError without leaking the message", async () => {
    const { refundList, gateway } = setup();
    refundList.mockRejectedValue(new Error("secret provider detail"));

    const error = await gateway.listRefunds("pi_1").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(PaymentUnavailableError);
    expect((error as Error).message).not.toContain("secret provider detail");
  });

  it("maps a thrown non-Error value to PaymentUnavailableError", async () => {
    const { refundList, gateway } = setup();
    refundList.mockRejectedValue("boom");

    await expect(gateway.listRefunds("pi_1")).rejects.toBeInstanceOf(PaymentUnavailableError);
  });
});
