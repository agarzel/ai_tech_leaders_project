import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { registerMentorSchema } from "@devmentor/core/validators/auth/register-mentor.schema";
import { clientIp } from "../../../../../lib/client-ip";
import { startSession } from "../../session-cookie";

// Public. The invitation decides the e-mail and the role; the invitation is used up in the same transaction.
// Failed attempts count against the client IP (10 per hour); a successful registration does not.
export const POST = apiHandler(
  async ({ req }) => {
    const { cradle } = await createRequestScope();
    const user = await cradle.invitationService.guardRegistration(clientIp(req), async () => {
      const { token, name, password } = await parseJsonBody(req, registerMentorSchema);
      return cradle.invitationService.consume(token, (em, email) =>
        cradle.authService.createMentorAccount(em, email, name, password),
      );
    });
    await startSession(cradle, user);
    return user;
  },
  { successStatus: 201 },
);
