import { redirect } from "next/navigation";
import type { SessionUserDto } from "@devmentor/core";
import { loginPathFor } from "./return-path";
import { getSessionUser } from "./session";

/** The signed-in user, or a redirect to `/login?from=<returnPath>` so they come back here after signing in. Call inside `<Suspense>`. */
export async function requireUser(returnPath: string): Promise<SessionUserDto> {
  const user = await getSessionUser();
  if (!user) redirect(loginPathFor(returnPath));
  return user;
}

/** `notFound()` for a missing record: matched by name, because the service's error class is not always the same instance here. */
export function isNotFound(error: unknown): boolean {
  return error instanceof Error && error.name === "NotFoundError";
}
