import { apiHandler, createRequestScope, requireSession } from "@devmentor/core";

// Development only: "pays" a fake Checkout session. With any other provider the service answers 404, so the
// route does not exist in production (where the fake provider is refused at startup).
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  await requireSession(req, cradle.authService);
  return cradle.fakeCheckoutService.pay(String(params.sessionId));
});
