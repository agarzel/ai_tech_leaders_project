import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { invitationPreviewSchema } from "@devmentor/core/validators/auth/register-mentor.schema";
import { clientIp } from "../../../../../lib/client-ip";

// Public. Reveals only the invited address and the expiry; every invalid token gets the same generic 404.
// The token is in the body, not the path, so it never reaches request logs.
export const POST = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  cradle.invitationService.guardPreview(clientIp(req)); // 20 per IP per 15 minutes, before any other work
  const { token } = await parseJsonBody(req, invitationPreviewSchema);
  return cradle.invitationService.verify(token);
});
