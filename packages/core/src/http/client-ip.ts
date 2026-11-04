/** Fallback key when no forwarding header is present (Next.js fills `x-forwarded-for` itself, so only outside it). */
export const UNKNOWN_CLIENT_IP = "unknown";

/**
 * Client IP for rate limiting (threat model T-03). Entries a client sends in `x-forwarded-for` come first; each
 * proxy appends the address it saw, and Next.js sets the socket address when the header is missing. So the trusted
 * address is the `trustedProxyHops`-th entry from the right – never the first one, which the client controls.
 */
export function clientIp(req: Request, trustedProxyHops: number): string {
  const chain = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (chain.length > 0) return chain[Math.max(0, chain.length - trustedProxyHops)];
  return req.headers.get("x-real-ip")?.trim() || UNKNOWN_CLIENT_IP;
}
