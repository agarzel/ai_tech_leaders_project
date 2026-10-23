import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { registerMentorSchema } from "@devmentor/core/validators/auth/register-mentor.schema";
import { startSession } from "../../session-cookie";

// Public. The invitation decides the e-mail and the role; the invitation is used up in the same transaction.
export const POST = apiHandler(
  async ({ req }) => {
    const { token, name, password } = await parseJsonBody(req, registerMentorSchema);
    const { cradle } = await createRequestScope();
    const user = await cradle.invitationService.consume(token, (em, email) =>
      cradle.authService.createMentorAccount(em, email, name, password),
    );
    await startSession(cradle, user);
    return user;
  },
  { successStatus: 201 },
);
