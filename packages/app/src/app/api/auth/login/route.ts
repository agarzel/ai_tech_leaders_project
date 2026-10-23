import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { loginSchema } from "@devmentor/core/validators/auth/login.schema";
import { startSession } from "../session-cookie";

// Public. Wrong credentials are one generic 401; too many attempts per email are a 429 (both from AuthService).
export const POST = apiHandler(async ({ req }) => {
  const { email, password } = await parseJsonBody(req, loginSchema);
  const { cradle } = await createRequestScope();
  const user = await cradle.authService.login(email, password);
  await startSession(cradle, user);
  return user;
});
