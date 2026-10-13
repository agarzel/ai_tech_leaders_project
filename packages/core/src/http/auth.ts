import { getEnv } from "../config/env";
import { ForbiddenError } from "./errors";

/**
 * TEMPORARY until the `auth` concept exists (sessions, roles).
 * Admin endpoints are open in development/test and closed (403) in production – fail closed, never open.
 * Replace with `requireSession(req)` + `requireRole(session, "admin")` when auth is implemented.
 */
export function requireAdmin(): void {
  if (getEnv().NODE_ENV === "production") {
    throw new ForbiddenError("Admin access requires authentication, which is not implemented yet");
  }
}
