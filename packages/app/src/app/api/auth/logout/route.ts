import { cookies } from "next/headers";
import { apiHandler, createRequestScope, SESSION_COOKIE_NAME } from "@devmentor/core";

// Needs no session: logging out when already signed out (or expired) just ends in the same state. With a valid
// session it ends every session of that user, so a copied cookie stops working too (threat model T-07).
export const POST = apiHandler(async () => {
  const jar = await cookies();
  const { cradle } = await createRequestScope();
  await cradle.authService.revokeSessions(jar.get(SESSION_COOKIE_NAME)?.value);
  jar.delete(SESSION_COOKIE_NAME);
  return null;
});
