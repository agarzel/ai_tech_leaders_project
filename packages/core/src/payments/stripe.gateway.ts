import type Stripe from "stripe";
import { logger } from "../logger";
import { PaymentUnavailableError, ValidationError } from "../http/errors";
import type { CheckoutInput, CheckoutSession, ExpiredCheckout, PaymentEvent, PaymentGateway, RefundRecord } from "./payment-gateway";

/** Stripe reports several transient states; only `succeeded` and a definite failure are final outcomes. */
function mapRefundStatus(status: Stripe.Refund["status"]): RefundRecord["status"] {
  if (status === "succeeded") return "succeeded";
  if (status === "failed" || status === "canceled") return "failed";
  return "pending";
}

/** The slice of the Stripe SDK this gateway uses; injected so unit tests never touch the network. */
export type StripeClient = Pick<Stripe, "checkout" | "refunds" | "webhooks">;

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
      // Only the error's type is logged: the provider's message can carry credentials or request details.
      logger.error({ errorType: error instanceof Error ? error.name : typeof error }, "Stripe Checkout creation failed");
      throw new PaymentUnavailableError();
    }
    if (!session.url) throw new PaymentUnavailableError();
    return { sessionId: session.id, url: session.url };
  }

  async expireCheckout(sessionId: string): Promise<ExpiredCheckout> {
    try {
      const sessions = this.options.client.checkout.sessions;
      // Read first: expiring a completed or already expired session is an error at Stripe, and both outcomes are answers here.
      const session = await sessions.retrieve(sessionId);
      if (session.status === "complete") {
        if (session.payment_status !== "paid") throw new Error("Checkout completed without payment");
        return { state: "paid", paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null };
      }
      if (session.status === "open") await sessions.expire(sessionId);
      return { state: "expired" };
    } catch (error) {
      logger.error({ errorType: error instanceof Error ? error.name : typeof error }, "Stripe Checkout expiry failed");
      throw new PaymentUnavailableError();
    }
  }

  async refund(input: { paymentIntentId: string; amount: number; idempotencyKey: string }): Promise<string> {
    try {
      const refund = await this.options.client.refunds.create(
        { payment_intent: input.paymentIntentId, amount: input.amount },
        { idempotencyKey: input.idempotencyKey },
      );
      return refund.id;
    } catch (error) {
      logger.error({ errorType: error instanceof Error ? error.name : typeof error }, "Stripe refund failed");
      throw new PaymentUnavailableError();
    }
  }

  async listRefunds(paymentIntentId: string): Promise<RefundRecord[]> {
    try {
      const refunds = await this.options.client.refunds.list({ payment_intent: paymentIntentId });
      return refunds.data.map((refund) => ({ id: refund.id, status: mapRefundStatus(refund.status) }));
    } catch (error) {
      logger.error({ errorType: error instanceof Error ? error.name : typeof error }, "Stripe refund lookup failed");
      throw new PaymentUnavailableError();
    }
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

    if (event.type === "refund.updated" || event.type === "charge.refunded") {
      const refund = event.type === "refund.updated" ? event.data.object : event.data.object.refunds?.data[0];
      return this.toRefundEvent(refund, event.type);
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

  /** A refund webhook is acted on only once it carries a final status and a resolvable payment intent id. */
  private toRefundEvent(refund: Stripe.Refund | undefined, providerType: string): PaymentEvent {
    if (!refund) return { type: "ignored", providerType };
    const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : null;
    const status = mapRefundStatus(refund.status);
    if (!paymentIntentId || status === "pending") return { type: "ignored", providerType };
    return { type: "refund.updated", paymentIntentId, refundId: refund.id, status };
  }
}
