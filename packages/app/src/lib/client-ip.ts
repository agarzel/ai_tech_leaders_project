import { clientIp as clientIpFromHeaders, getEnv } from "@devmentor/core";

/** Client IP for rate limiting, read with the configured number of trusted proxies (see `clientIp` in core). */
export function clientIp(req: Request): string {
  return clientIpFromHeaders(req, getEnv().TRUSTED_PROXY_HOPS);
}
