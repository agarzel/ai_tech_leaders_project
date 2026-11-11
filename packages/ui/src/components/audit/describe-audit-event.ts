// ui may not import @devmentor/core or @devmentor/db (ESLint boundaries), so the audit actions are listed here
// too. The audit-log integration test renders every action and fails on a raw value, which catches a drift.

export const AUDIT_ACTION_LABELS = {
  "user.created": "User created",
  "user.role_changed": "Role changed",
  "user.deleted": "User deleted",
  "invitation.created": "Invitation created",
  "invitation.revoked": "Invitation revoked",
  "auth.admin_password_set": "Admin password set from the CLI",
  "auth.password_set": "Password set from the CLI",
  "auth.login_failed": "Failed login",
} as const;

export type AuditActionName = keyof typeof AUDIT_ACTION_LABELS;

/** A user as the audit list returns them: resolved now, or only the id when the account was deleted. */
export type AuditUser = { id: string; name: string; email: string } | { id: string; deleted: true };

/** The shape of `GET /api/admin/audit-events` items (AuditEventDto in core), as the table needs it. */
export type AuditEventView = {
  id: string;
  occurredAt: string;
  action: string;
  actorKind: string;
  actor: AuditUser | null;
  target: AuditUser | null;
  details: Record<string, unknown>;
};

export function isAuditAction(action: string): action is AuditActionName {
  return Object.hasOwn(AUDIT_ACTION_LABELS, action);
}

/** The action in plain words, never the raw key: "Role changed", or "Unknown action" for a key ui does not know. */
export function describeAction(action: string): string {
  return isAuditAction(action) ? AUDIT_ACTION_LABELS[action] : "Unknown action";
}

const ROLE_LABELS: Record<string, string> = { admin: "admin", mentor: "mentor", mentee: "mentee" };
const role = (value: unknown) => (typeof value === "string" && ROLE_LABELS[value]) || "unknown role";

/** The details column in plain words, e.g. "mentee → mentor". "—" when the action has nothing to add. */
export function describeDetails(event: Pick<AuditEventView, "action" | "details">): string {
  const details = event.details;
  switch (event.action) {
    case "user.role_changed":
      return `${role(details.from)} → ${role(details.to)}`;
    case "user.created":
      return `As ${role(details.role)}`;
    case "user.deleted":
      return `Was ${role(details.role)}`;
    case "invitation.revoked":
      return "Replaced by a new invitation";
    case "auth.admin_password_set":
      return details.created ? "New admin account" : details.promoted ? "Promoted to admin" : "Already an admin";
    default:
      return "—";
  }
}

/** Actor or target in plain words: "Name · email", "Deleted user", "CLI", "Anonymous" or "—". */
export function describeUser(user: AuditUser | null, kind?: string): string {
  if (user) return "deleted" in user ? "Deleted user" : `${user.name} · ${user.email}`;
  if (kind === "cli") return "CLI";
  if (kind === "anonymous") return "Anonymous";
  return "—";
}
