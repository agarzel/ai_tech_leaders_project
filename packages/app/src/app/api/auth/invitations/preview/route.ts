import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { invitationPreviewSchema } from "@devmentor/core/validators/auth/register-mentor.schema";

// Public. Reveals only the invited address and the expiry; every invalid token gets the same generic 404.
// The token is in the body, not the path, so it never reaches request logs.
export const POST = apiHandler(async ({ req }) => {
  const { token } = await parseJsonBody(req, invitationPreviewSchema);
  const { cradle } = await createRequestScope();
  return cradle.invitationService.verify(token);
});
