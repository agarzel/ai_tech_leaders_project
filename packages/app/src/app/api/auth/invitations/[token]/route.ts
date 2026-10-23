import { apiHandler, createRequestScope } from "@devmentor/core";

// Public. Reveals only the invited address and the expiry; every invalid token gets the same generic 404.
export const GET = apiHandler(async ({ params }) => {
  const { cradle } = await createRequestScope();
  return cradle.invitationService.verify(String(params.token));
});
