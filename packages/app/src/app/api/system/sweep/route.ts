import { apiHandler, createRequestScope, SWEEP_TOKEN_HEADER, verifySweepSecret } from "@devmentor/core";

// Called by an external scheduler with the `x-sweep-token` header (and the client header every POST carries).
// The token is checked before any work: a missing or wrong one is 401 and nothing runs.
export const POST = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  verifySweepSecret(req.headers.get(SWEEP_TOKEN_HEADER), cradle.env.SWEEP_SECRET);
  return cradle.sweepService.run();
});
