/** Fallback key when no proxy header is present, so the limit still applies (to all such clients together). */
export const UNKNOWN_CLIENT_IP = "unknown";

/** Client IP for rate limiting: first hop of `x-forwarded-for`, else `x-real-ip`, else a constant key. */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip")?.trim() || UNKNOWN_CLIENT_IP;
}
