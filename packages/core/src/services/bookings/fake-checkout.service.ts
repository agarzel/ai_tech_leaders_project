import type { Env } from "../../config/env";
import { NotFoundError } from "../../http/errors";
import type { FakeCheckoutSession, FakeGateway } from "../../payments/fake.gateway";
import type { PaymentGateway } from "../../payments/payment-gateway";
import type { BookingTransitions } from "./booking-transitions.service";
import { paymentWebhookHandler } from "./payment-webhook";

/** What the development checkout page shows about a fake Checkout session. */
export type FakeCheckoutDto = { sessionId: string; amount: number; currency: string; description: string };

const SESSION_NOT_FOUND = "Checkout session not found";

/**
 * The development "payment page" behind the fake provider. Everything refuses with `NotFoundError` unless
 * `PAYMENTS_PROVIDER` is `fake`, so with the real provider (and always in production, where `fake` is refused at
 * startup) the page and its route do not exist. "Paying" posts the signed completion event through the same
 * webhook handler the provider would call.
 */
export class FakeCheckoutService {
  constructor(
    private readonly deps: {
      env: Pick<Env, "PAYMENTS_PROVIDER">;
      paymentGateway: PaymentGateway;
      bookingTransitions: BookingTransitions;
    },
  ) {}

  describe(sessionId: string): FakeCheckoutDto {
    const session = this.session(sessionId);
    return { sessionId, amount: session.amount, currency: session.currency, description: session.description };
  }

  /** Completes the session; returns the app path the mentee returns to (the booking page). */
  async pay(sessionId: string): Promise<{ returnPath: string }> {
    const session = this.session(sessionId);
    // `session()` just found it, so the gateway is the fake one and knows the session.
    const event = (this.deps.paymentGateway as FakeGateway).createCompletedEvent(sessionId) as { rawBody: string; headers: Record<string, string> };
    const handler = paymentWebhookHandler({ paymentGateway: this.deps.paymentGateway, bookingTransitions: this.deps.bookingTransitions });
    const response = await handler(new Request("http://localhost/api/payments/webhook", { method: "POST", body: event.rawBody, headers: event.headers }));
    if (!response.ok) throw new Error(`The fake payment was not applied (status ${response.status})`);
    return { returnPath: new URL(session.successUrl).pathname };
  }

  private session(sessionId: string): FakeCheckoutSession {
    if (this.deps.env.PAYMENTS_PROVIDER !== "fake") throw new NotFoundError(SESSION_NOT_FOUND);
    // Matched by shape, not `instanceof`: the gateway can come from another module graph (see `apiHandler`).
    const gateway = this.deps.paymentGateway as Partial<FakeGateway>;
    const session = typeof gateway.getSession === "function" ? gateway.getSession(sessionId) : undefined;
    if (!session) throw new NotFoundError(SESSION_NOT_FOUND);
    return session;
  }
}
