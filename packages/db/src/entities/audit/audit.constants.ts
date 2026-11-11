// Client-safe: no @mikro-orm imports (re-exported from `@devmentor/db/constants`).

/** Every action the audit log records (#119, threat model T-09). */
export const AUDIT_ACTIONS = [
  "user.created",
  "user.role_changed",
  "user.deleted",
  "invitation.created",
  "invitation.revoked",
  "auth.admin_password_set",
  "auth.password_set",
  "auth.login_failed",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Who performed the action: a signed-in admin, the operator CLI, or nobody signed in (failed login). */
export const AUDIT_ACTOR_KINDS = ["admin", "cli", "anonymous"] as const;
export type AuditActorKind = (typeof AUDIT_ACTOR_KINDS)[number];
