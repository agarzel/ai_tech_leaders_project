import { apiHandler, createRequestScope, parseJsonBody } from "@devmentor/core";
import { loginSchema } from "@devmentor/core/validators/auth/login.schema";
import { clientIp } from "../../../../lib/client-ip";
import { startSession } from "../session-cookie";

// Public. Wrong credentials are one generic 401; too many attempts per IP + email or per IP are a 429.
export const POST = apiHandler(async ({ req }) => {
  const { email, password } = await parseJsonBody(req, loginSchema);
  const { cradle } = await createRequestScope();
  const user = await cradle.authService.login(email, password, clientIp(req));
  await startSession(cradle, user);
  return user;
});
