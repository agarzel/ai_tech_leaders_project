/** Name of the session cookie – the one place it is defined (read by `requireSession`, set by the auth routes). */
export const SESSION_COOKIE_NAME = "devmentor_session";

/** Session (and cookie) lifetime: 24 hours, no refresh. */
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export type SessionCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: "/";
  maxAge: number;
};

/** Attributes for the session cookie. Core never imports `next`; the app route passes these to `cookies().set`. */
export function sessionCookieOptions(nodeEnv: string): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: nodeEnv === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
