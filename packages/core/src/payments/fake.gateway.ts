import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { ValidationError } from "../http/errors";
import type { CheckoutInput, CheckoutSession, ExpiredCheckout, PaymentEvent, PaymentGateway } from "./payment-gateway";

export const FAKE_SIGNATURE_HEADER = "x-fake-signature";

const fakeEventSchema = z.object({
  sessionId: z.string(),
  bookingId: z.string().nullable(),
  paymentStatus: z.string(),
  amountTotal: z.number().nullable(),
  currency: z.string().nullable(),
  paymentIntentId: z.string().nullable(),
});

export type FakeCheckoutSession = CheckoutInput & { sessionId: string };

/**
 * Development and test provider: no network. Sessions live in the memory of this process; "paying" means posting an
 * HMAC-SHA256-signed event to the webhook, which `parseWebhook` verifies like the real provider's signature.
 */
export class FakeGateway implements PaymentGateway {
  private readonly sessions = new Map<string, FakeCheckoutSession>();
  // Sessions a signed "completed" event was created for: expiring one of them reports `paid`, like the real provider.
  private readonly paid = new Set<string>();

  constructor(private readonly options: { secret: string; appUrl: string }) {}

  async createCheckout(input: CheckoutInput): Promise<CheckoutSession> {
    const existing = [...this.sessions.values()].find((session) => session.idempotencyKey === input.idempotencyKey);
    const session = existing ?? { ...input, sessionId: `fake_cs_${randomUUID()}` };
    this.sessions.set(session.sessionId, session);
    return { sessionId: session.sessionId, url: new URL(`/dev/fake-checkout/${session.sessionId}`, this.options.appUrl).toString() };
  }

  /** A paid session reports `paid`; anything else (also a session this process never saw) is expired. */
  async expireCheckout(sessionId: string): Promise<ExpiredCheckout> {
    return this.paid.has(sessionId) ? { state: "paid", paymentIntentId: `fake_pi_${sessionId}` } : { state: "expired" };
  }

  /** Deterministic: the refund id is derived from the key, so the same key always gives the same refund. */
  async refund(input: { paymentIntentId: string; amount: number; idempotencyKey: string }): Promise<string> {
    return `fake_re_${input.idempotencyKey}`;
  }

  getSession(sessionId: string): FakeCheckoutSession | undefined {
    return this.sessions.get(sessionId);
  }

  /** The signed "payment completed" event for a known session, ready to post to the webhook; undefined for an unknown one. */
  createCompletedEvent(sessionId: string): { rawBody: string; headers: Record<string, string> } | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    this.paid.add(sessionId);
    const rawBody = JSON.stringify({
      sessionId,
      bookingId: session.bookingId,
      paymentStatus: "paid",
      amountTotal: session.amount,
      currency: session.currency,
      paymentIntentId: `fake_pi_${sessionId}`,
    });
    return { rawBody, headers: { [FAKE_SIGNATURE_HEADER]: this.sign(rawBody) } };
  }

  parseWebhook(rawBody: string, headers: Headers): PaymentEvent {
    const signature = headers.get(FAKE_SIGNATURE_HEADER);
    if (!signature || !this.isValid(rawBody, signature)) throw new ValidationError("Invalid webhook signature");

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      throw new ValidationError("Invalid webhook payload");
    }
    const parsed = fakeEventSchema.safeParse(payload);
    if (!parsed.success) throw new ValidationError("Invalid webhook payload");
    return { type: "checkout.completed", ...parsed.data };
  }

  private sign(rawBody: string): string {
    return createHmac("sha256", this.options.secret).update(rawBody).digest("hex");
  }

  private isValid(rawBody: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(rawBody));
    const received = Buffer.from(signature);
    // timingSafeEqual throws on different lengths, so compare those first (length is not secret).
    return received.length === expected.length && timingSafeEqual(received, expected);
  }
}
