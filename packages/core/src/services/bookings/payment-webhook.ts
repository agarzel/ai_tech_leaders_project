import { webhookHandler } from "../../http/webhookHandler";
import type { PaymentGateway } from "../../payments/payment-gateway";
import type { BookingTransitions } from "./booking-transitions.service";

/** The route handler for `POST /api/payments/webhook`: verifies the signature, then applies the event. */
export function paymentWebhookHandler(deps: { paymentGateway: PaymentGateway; bookingTransitions: BookingTransitions }) {
  return webhookHandler(
    (rawBody, headers) => deps.paymentGateway.parseWebhook(rawBody, headers),
    (event) => deps.bookingTransitions.handlePaymentEvent(event),
  );
}
