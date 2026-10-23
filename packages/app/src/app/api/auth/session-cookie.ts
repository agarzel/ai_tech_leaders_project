import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, sessionCookieOptions, type Cradle, type SessionUserDto } from "@devmentor/core";

/** Issues the signed session token for `user` and sets it as the session cookie on the response. */
export async function startSession({ authService, env }: Pick<Cradle, "authService" | "env">, user: SessionUserDto) {
  const token = await authService.issueToken(user);
  (await cookies()).set(SESSION_COOKIE_NAME, token, sessionCookieOptions(env.NODE_ENV));
}
