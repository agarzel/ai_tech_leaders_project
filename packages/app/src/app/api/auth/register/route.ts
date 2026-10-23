import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { registerSchema } from "@devmentor/core/validators/auth/register.schema";
import { startSession } from "../session-cookie";

// Public. Always creates a mentee; the role is not part of the schema.
export const POST = apiHandler(
  async ({ req }) => {
    const { name, email, password } = await parseJsonBody(req, registerSchema);
    const { cradle } = await createRequestScope();
    const user = await cradle.authService.register(email, name, password);
    await startSession(cradle, user);
    return user;
  },
  { successStatus: 201 },
);
