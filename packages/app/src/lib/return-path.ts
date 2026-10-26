/**
 * The page to return to after signing in (`/login?from=…`). Only a path on this site is accepted: anything else
 * (another origin, a protocol-relative `//host`, a backslash trick) is dropped, so a login link cannot send
 * a person to another site.
 */
export function safeReturnPath(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}

/** `/login?from=<path>` – the sign-in page that sends the person back to `path`. */
export function loginPathFor(returnPath: string): string {
  return `/login?from=${encodeURIComponent(returnPath)}`;
}
