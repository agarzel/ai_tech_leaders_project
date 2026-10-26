import { createHash, timingSafeEqual } from "node:crypto";
import { UnauthorizedError } from "./errors";

export const SWEEP_TOKEN_HEADER = "x-sweep-token";
/** A shorter configured secret is refused outright (the configuration schema requires the same minimum). */
export const SWEEP_SECRET_MIN_LENGTH = 32;

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Guards the sweep endpoint: the `x-sweep-token` header must equal `SWEEP_SECRET`. Fails closed – a missing header,
 * a wrong value or a too short configured secret all throw the same `UnauthorizedError`.
 */
export function verifySweepSecret(header: string | null | undefined, secret: string): void {
  // Equal-length digests make the comparison constant-time regardless of the header's length.
  const matches = timingSafeEqual(digest(header ?? ""), digest(secret));
  if (!header || secret.length < SWEEP_SECRET_MIN_LENGTH || !matches) throw new UnauthorizedError("Invalid sweep token");
}
