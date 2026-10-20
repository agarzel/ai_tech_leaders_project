// Shapes from spec E01 (Data Model `MentorInvitation`, API `GET, POST /api/admin/invitations`).
// ui must not import core, so they are restated here (C1, C2).

/** Derived by core from `usedAt`, `revokedAt` (a newer invitation for the same email – Q6) and `expiresAt` (14 days). */
export type InvitationStatus = "pending" | "used" | "expired" | "revoked";

/** One row of the admin list. The raw token never appears here – only the POST response carries the link. */
export type Invitation = { id: string; email: string; status: InvitationStatus; createdAt: string; expiresAt: string };
