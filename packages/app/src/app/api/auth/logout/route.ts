import { cookies } from "next/headers";
import { apiHandler, SESSION_COOKIE_NAME } from "@devmentor/core";

// Needs no session: logging out when already signed out (or expired) just ends in the same state.
export const POST = apiHandler(async () => {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  return null;
});
