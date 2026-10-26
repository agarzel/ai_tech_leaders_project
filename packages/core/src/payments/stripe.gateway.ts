import type Stripe from "stripe";
import { logger } from "../logger";
import { PaymentUnavailableError, ValidationError } from "../http/errors";
import type { CheckoutInput, CheckoutSession, PaymentEvent, PaymentGateway } from "./payment-gateway";

/** The slice of the Stripe SDK this gateway uses; injected so unit tests never touch the network. */
export type StripeClient = Pick<Stripe, "checkout" | "webhooks">;

export class StripeGateway implements PaymentGateway {
  constructor(private readonly options: { client: StripeClient; webhookSecret: string }) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    let session;
    try {
      session = await this.options.client.checkout.sessions.create(
        {
          mode: "payment",
          // Cards only (D16; stripe 23 replaced payment_method_types with allowed_payment_method_types): BLIK and Przelewy24 confirm later and are a separate decision.
          allowed_payment_method_types: ["card"],
          client_reference_id: input.bookingId,
          metadata: { bookingId: input.bookingId },
          customer_email: input.customerEmail,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: input.currency.toLowerCase(),
                unit_amount: input.amount,
                product_data: { name: input.description },
              },
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          expires_at: Math.floor(input.expiresAt.getTime() / 1000),
        },
        { idempotencyKey: input.idempotencyKey },
      );
    } catch (error) {
      // Only the error's type and message are logged (never the raw error: it can carry request details).
      logger.error(
        { errorType: error instanceof Error ? error.name : typeof error, errorMessage: error instanceof Error ? error.message : undefined },
        "Stripe Checkout creation failed",
      );
      throw new PaymentUnavailableError();
    }
    if (!session.url) throw new PaymentUnavailableError();
    return { sessionId: session.id, url: session.url };
  }

  parseWebhook(rawBody: string, headers: Headers): PaymentEvent {
    const signature = headers.get("stripe-signature");
    if (!signature) throw new ValidationError("Invalid webhook signature");

    let event;
    try {
      event = this.options.client.webhooks.constructEvent(rawBody, signature, this.options.webhookSecret);
    } catch {
      throw new ValidationError("Invalid webhook signature");
    }

    if (event.type !== "checkout.session.completed") return { type: "ignored", providerType: event.type };
    const session = event.data.object;
    return {
      type: "checkout.completed",
      sessionId: session.id,
      bookingId: session.client_reference_id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
    };
  }
}
