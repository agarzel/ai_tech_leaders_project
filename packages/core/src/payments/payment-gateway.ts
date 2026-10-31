/** What the app asks a payment provider to charge for one booking. `amount` is in grosze (minor units). */
export type CheckoutInput = {
  bookingId: string;
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
  /** Same key → same session, so a retry after a lost response never creates a second charge. */
  idempotencyKey: string;
  customerEmail?: string;
};

export type CheckoutSession = { sessionId: string; url: string };

/** What the provider says about a Checkout session the sweep tried to expire. */
export type ExpiredCheckout = { state: "expired" } | { state: "paid"; paymentIntentId: string | null };

/** One refund of a payment intent, as the provider currently sees it. `pending` is not yet a final outcome. */
export type RefundRecord = { id: string; status: "pending" | "succeeded" | "failed" };

/** A verified webhook event, reduced to what the app acts on. Anything else is `ignored` (answered with 200). */
export type PaymentEvent =
  | {
      type: "checkout.completed";
      sessionId: string;
      bookingId: string | null;
      paymentStatus: string;
      amountTotal: number | null;
      currency: string | null;
      paymentIntentId: string | null;
    }
  | {
      type: "refund.updated";
      paymentIntentId: string;
      refundId: string;
      /** Only a final state is reported; a `pending` refund is `ignored` by `parseWebhook` instead. */
      status: "succeeded" | "failed";
    }
  | { type: "ignored"; providerType: string };

/** Port to the payment provider. One implementation per process, chosen by `PAYMENTS_PROVIDER`. */
export interface PaymentGateway {
  /** Throws `PaymentUnavailableError` when the provider cannot create the session; nothing was charged then. */
  createCheckout(input: CheckoutInput): Promise<CheckoutSession>;
  /**
   * Closes an unpaid session so it can no longer be paid. Idempotent: an already expired session is success.
   * Returns `paid` when the session was completed and paid before it could be closed. Throws `PaymentUnavailableError` on a provider failure.
   */
  expireCheckout(sessionId: string): Promise<ExpiredCheckout>;
  /** Returns the full amount to the payer. Idempotent by key (same key → same refund id). Throws `PaymentUnavailableError` on a provider failure. */
  refund(input: { paymentIntentId: string; amount: number; idempotencyKey: string }): Promise<string>;
  /**
   * Refunds of a payment intent, as the provider currently sees them. Checked before retrying a refund, so a
   * pruned idempotency key (the provider keeps keys for 24h only) never creates a second refund. Throws
   * `PaymentUnavailableError` on a provider failure.
   */
  listRefunds(paymentIntentId: string): Promise<RefundRecord[]>;
  /** Verifies the provider's signature over the raw body, then parses it. Throws `ValidationError` when it does not verify. */
  parseWebhook(rawBody: string, headers: Headers): PaymentEvent;
}
