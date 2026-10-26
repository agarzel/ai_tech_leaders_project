import { cookies } from "next/headers";
import { connection } from "next/server";
import { createRequestScope, SESSION_COOKIE_NAME, type SessionUserDto } from "@devmentor/core";

/**
 * The signed-in user behind the request's session cookie, for server components. Fails closed: a missing,
 * invalid, expired or orphaned cookie means signed out (`null`). Anything else (e.g. the database is down) is rethrown.
 * Call it inside `<Suspense>`: it reads request data.
 */
export async function getSessionUser(): Promise<SessionUserDto | null> {
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const { authService } = (await createRequestScope()).cradle;
  try {
    return await authService.authenticate(token);
  } catch (error) {
    // Matched by name, like isNotFound: the error class is not always the same instance in this layer.
    if (error instanceof Error && error.name === "UnauthorizedError") return null;
    throw error;
  }
}
