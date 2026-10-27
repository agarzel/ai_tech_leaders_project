import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "../../http/errors";
import type { PaymentGateway } from "../../payments/payment-gateway";
import type { BookingTransitions } from "./booking-transitions.service";
import { paymentWebhookHandler } from "./payment-webhook";

const event = { type: "ignored", providerType: "x" };

function setup() {
  const paymentGateway = { parseWebhook: vi.fn().mockReturnValue(event) };
  const bookingTransitions = { handlePaymentEvent: vi.fn().mockResolvedValue(undefined) };
  const handler = paymentWebhookHandler({
    paymentGateway: paymentGateway as unknown as PaymentGateway,
    bookingTransitions: bookingTransitions as unknown as BookingTransitions,
  });
  return { paymentGateway, bookingTransitions, handler };
}

describe("paymentWebhookHandler", () => {
  it("verifies the raw body and headers, then applies the event", async () => {
    const { paymentGateway, bookingTransitions, handler } = setup();

    const response = await handler(new Request("https://app.example/api/payments/webhook", { method: "POST", body: "raw", headers: { "x-sig": "s" } }));

    expect(response.status).toBe(200);
    expect(paymentGateway.parseWebhook).toHaveBeenCalledWith("raw", expect.any(Headers));
    expect(bookingTransitions.handlePaymentEvent).toHaveBeenCalledWith(event);
  });

  it("never applies an event whose signature does not verify", async () => {
    const { paymentGateway, bookingTransitions, handler } = setup();
    paymentGateway.parseWebhook.mockImplementation(() => {
      throw new ValidationError("Invalid signature");
    });

    const response = await handler(new Request("https://app.example/api/payments/webhook", { method: "POST", body: "raw" }));

    expect(response.status).toBe(400);
    expect(bookingTransitions.handlePaymentEvent).not.toHaveBeenCalled();
  });
});
