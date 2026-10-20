// Shapes from spec E01 (Data Model `MentorInvitation`, API `GET, POST /api/admin/invitations`).
// ui must not import core, so they are restated here (C1, C2).

/** Derived by core from `usedAt`, `revokedAt` (a newer invitation for the same email – Q6) and `expiresAt` (14 days). */
export type InvitationStatus = "pending" | "used" | "expired" | "revoked";

/** One row of the admin list. The raw token never appears here – only the POST response carries the link. */
export type Invitation = { id: string; email: string; status: InvitationStatus; createdAt: string; expiresAt: string };

/**
 * `GET /api/mentor/profile` – the mentor's own profile (spec E01, Data Model `MentorProfile`). Prices in
 * grosze, `null` until set; `headline` and `bio` are `null` on a profile created lazily on the first visit.
 */
export type MentorProfile = {
  name: string;
  headline: string | null;
  bio: string | null;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  currency: string;
  shareSlug: string;
  listed: boolean;
};

/** What `PUT /api/mentor/profile` takes (spec E01, API Contracts). */
export type MentorProfileInput = {
  name: string;
  headline: string;
  bio: string;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  listed: boolean;
};

/** `PublicMentorDto` (spec E01): no email; only listed or linked, bookable mentors reach the public pages. */
export type PublicMentor = {
  slug: string;
  name: string;
  headline: string | null;
  bio: string | null;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  currency: string;
  soonestSlotAt: string | null;
};
