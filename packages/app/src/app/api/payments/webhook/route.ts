import { createRequestScope, paymentWebhookHandler } from "@devmentor/core";

// Server-to-server: no session and no CSRF header. `paymentWebhookHandler` verifies the provider's signature
// before anything is applied, and is the only route that skips the CSRF check.
export async function POST(req: Request): Promise<Response> {
  const { cradle } = await createRequestScope();
  return paymentWebhookHandler({ paymentGateway: cradle.paymentGateway, bookingTransitions: cradle.bookingTransitions })(req);
}
