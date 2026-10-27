import { describe, expect, it, vi } from "vitest";
import { NotFoundError } from "../../http/errors";
import { FakeGateway } from "../../payments/fake.gateway";
import type { PaymentGateway } from "../../payments/payment-gateway";
import type { BookingTransitions } from "./booking-transitions.service";
import { FakeCheckoutService } from "./fake-checkout.service";

const checkout = {
  bookingId: "b1",
  amount: 15_000,
  currency: "PLN",
  description: "DevMentor session, 25 min",
  successUrl: "http://localhost:3000/bookings/b1",
  cancelUrl: "http://localhost:3000/bookings/b1",
  expiresAt: new Date("2026-06-01T09:00:00Z"),
  idempotencyKey: "checkout:b1",
};

async function setup(provider: "fake" | "stripe" = "fake") {
  const gateway = new FakeGateway({ secret: "s".repeat(32), appUrl: "http://localhost:3000" });
  const { sessionId } = await gateway.createCheckout(checkout);
  const bookingTransitions = { handlePaymentEvent: vi.fn().mockResolvedValue(undefined) };
  const service = new FakeCheckoutService({
    env: { PAYMENTS_PROVIDER: provider },
    paymentGateway: gateway,
    bookingTransitions: bookingTransitions as unknown as BookingTransitions,
  });
  return { gateway, sessionId, bookingTransitions, service };
}

describe("FakeCheckoutService.describe", () => {
  it("describes a known session", async () => {
    const { service, sessionId } = await setup();

    expect(service.describe(sessionId)).toEqual({ sessionId, amount: 15_000, currency: "PLN", description: "DevMentor session, 25 min" });
  });

  it("refuses with not found when the provider is not fake", async () => {
    const { service, sessionId } = await setup("stripe");

    expect(() => service.describe(sessionId)).toThrow(NotFoundError);
  });

  it("refuses an unknown session", async () => {
    const { service } = await setup();

    expect(() => service.describe("fake_cs_unknown")).toThrow(NotFoundError);
  });

  it("refuses when the gateway is not a fake one", async () => {
    const service = new FakeCheckoutService({
      env: { PAYMENTS_PROVIDER: "fake" },
      paymentGateway: {} as PaymentGateway,
      bookingTransitions: {} as BookingTransitions,
    });

    expect(() => service.describe("any")).toThrow(NotFoundError);
  });
});

describe("FakeCheckoutService.pay", () => {
  it("posts the signed completion through the webhook handler and returns the booking path", async () => {
    const { service, sessionId, bookingTransitions } = await setup();

    await expect(service.pay(sessionId)).resolves.toEqual({ returnPath: "/bookings/b1" });
    expect(bookingTransitions.handlePaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "checkout.completed", sessionId, bookingId: "b1", paymentStatus: "paid", amountTotal: 15_000 }),
    );
  });

  it("refuses with not found when the provider is not fake, and applies nothing", async () => {
    const { service, sessionId, bookingTransitions } = await setup("stripe");

    await expect(service.pay(sessionId)).rejects.toThrow(NotFoundError);
    expect(bookingTransitions.handlePaymentEvent).not.toHaveBeenCalled();
  });

  it("fails when the webhook handler rejects the event", async () => {
    const { service, sessionId, bookingTransitions } = await setup();
    bookingTransitions.handlePaymentEvent.mockRejectedValue(new Error("boom"));

    await expect(service.pay(sessionId)).rejects.toThrow("The fake payment was not applied (status 500)");
  });
});
