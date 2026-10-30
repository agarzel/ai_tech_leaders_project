import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { ValidationError } from "../http/errors";
import { FAKE_SIGNATURE_HEADER, FakeGateway } from "./fake.gateway";
import type { CheckoutInput } from "./payment-gateway";

const secret = "s".repeat(32);
const input: CheckoutInput = {
  bookingId: "booking-1",
  amount: 15000,
  currency: "PLN",
  description: "Mentoring session",
  successUrl: "http://localhost:3000/bookings/booking-1",
  cancelUrl: "http://localhost:3000/bookings/booking-1",
  expiresAt: new Date("2026-10-26T12:00:00Z"),
  idempotencyKey: "checkout:booking-1",
};

function gateway(appSecret = secret) {
  return new FakeGateway({ secret: appSecret, appUrl: "http://localhost:3000/" });
}

describe("FakeGateway", () => {
  it("creates a session whose url is the app's fake checkout page", async () => {
    const fake = gateway();

    const session = await fake.createCheckout(input);

    expect(session.url).toBe(`http://localhost:3000/dev/fake-checkout/${session.sessionId}`);
    expect(fake.getSession(session.sessionId)).toMatchObject({ bookingId: "booking-1", amount: 15000, currency: "PLN" });
  });

  it("returns the same session for the same idempotency key and a new one for another key", async () => {
    const fake = gateway();

    const first = await fake.createCheckout(input);
    const retry = await fake.createCheckout(input);
    const other = await fake.createCheckout({ ...input, idempotencyKey: "checkout:booking-2" });

    expect(retry).toEqual(first);
    expect(other.sessionId).not.toBe(first.sessionId);
  });

  it("does not know sessions it never created", () => {
    expect(gateway().getSession("fake_cs_unknown")).toBeUndefined();
    expect(gateway().createCompletedEvent("fake_cs_unknown")).toBeUndefined();
  });

  it("accepts a signed completion event and parses it", async () => {
    const fake = gateway();
    const { sessionId } = await fake.createCheckout(input);
    const event = fake.createCompletedEvent(sessionId)!;

    const parsed = fake.parseWebhook(event.rawBody, new Headers(event.headers));

    expect(parsed).toEqual({
      type: "checkout.completed",
      sessionId,
      bookingId: "booking-1",
      paymentStatus: "paid",
      amountTotal: 15000,
      currency: "PLN",
      paymentIntentId: `fake_pi_${sessionId}`,
    });
  });

  it("rejects a tampered body", async () => {
    const fake = gateway();
    const { sessionId } = await fake.createCheckout(input);
    const event = fake.createCompletedEvent(sessionId)!;

    expect(() => fake.parseWebhook(event.rawBody.replace("15000", "1"), new Headers(event.headers))).toThrow(ValidationError);
  });

  it("rejects an event signed with another secret", async () => {
    const fake = gateway();
    const forged = gateway("x".repeat(32));
    const { sessionId } = await forged.createCheckout(input);
    const event = forged.createCompletedEvent(sessionId)!;

    expect(() => fake.parseWebhook(event.rawBody, new Headers(event.headers))).toThrow("Invalid webhook signature");
  });

  it("rejects a missing or malformed signature header", async () => {
    const fake = gateway();
    const { sessionId } = await fake.createCheckout(input);
    const event = fake.createCompletedEvent(sessionId)!;

    expect(() => fake.parseWebhook(event.rawBody, new Headers())).toThrow(ValidationError);
    expect(() => fake.parseWebhook(event.rawBody, new Headers({ [FAKE_SIGNATURE_HEADER]: "short" }))).toThrow(ValidationError);
  });

  it("rejects a correctly signed body that is not valid JSON or has the wrong shape", () => {
    const fake = gateway();
    const signed = (rawBody: string) =>
      new Headers({ [FAKE_SIGNATURE_HEADER]: createHmac("sha256", secret).update(rawBody).digest("hex") });

    expect(() => fake.parseWebhook("not json", signed("not json"))).toThrow("Invalid webhook payload");
    expect(() => fake.parseWebhook('{"a":1}', signed('{"a":1}'))).toThrow("Invalid webhook payload");
  });

  it("reports an unpaid or unknown session as expired when expiring it", async () => {
    const fake = gateway();
    const { sessionId } = await fake.createCheckout(input);

    await expect(fake.expireCheckout(sessionId)).resolves.toEqual({ state: "expired" });
    await expect(fake.expireCheckout("fake_cs_unknown")).resolves.toEqual({ state: "expired" });
  });

  it("reports a session whose completed event was created as paid when expiring it", async () => {
    const fake = gateway();
    const { sessionId } = await fake.createCheckout(input);
    fake.createCompletedEvent(sessionId);

    await expect(fake.expireCheckout(sessionId)).resolves.toEqual({ state: "paid", paymentIntentId: `fake_pi_${sessionId}` });
  });

  it("derives the refund id from the idempotency key", async () => {
    const fake = gateway();
    const refund = { paymentIntentId: "pi_1", amount: 15000, idempotencyKey: "refund:booking-1" };

    expect(await fake.refund(refund)).toBe("fake_re_refund:booking-1");
    expect(await fake.refund(refund)).toBe(await fake.refund(refund));
  });

  it("lists a refund as succeeded once it was created", async () => {
    const fake = gateway();

    await fake.refund({ paymentIntentId: "pi_1", amount: 15000, idempotencyKey: "refund:booking-1" });

    await expect(fake.listRefunds("pi_1")).resolves.toEqual([{ id: "fake_re_refund:booking-1", status: "succeeded" }]);
  });

  it("lists no refunds for a payment intent it never refunded", async () => {
    await expect(gateway().listRefunds("pi_unknown")).resolves.toEqual([]);
  });

  it("does not list another payment intent's refund", async () => {
    const fake = gateway();

    await fake.refund({ paymentIntentId: "pi_1", amount: 15000, idempotencyKey: "refund:booking-1" });

    await expect(fake.listRefunds("pi_2")).resolves.toEqual([]);
  });
});
