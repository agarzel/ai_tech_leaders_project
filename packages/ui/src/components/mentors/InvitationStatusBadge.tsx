import { Badge } from "@devmentor/ui/components/ui/badge";
import type { InvitationStatus } from "./types";

export type { Invitation, InvitationStatus } from "./types";

// Statuses in neutral badges, never the accent (T10); the word carries the meaning, not the colour (WCAG 1.4.1).
const LABELS: Record<InvitationStatus, { label: string; variant: "secondary" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  used: { label: "Used", variant: "outline" },
  expired: { label: "Expired", variant: "outline" },
  revoked: { label: "Revoked", variant: "outline" },
};

/** Status of a mentor invitation in the admin list: pending, used, expired or revoked (replaced by a newer invitation) (spec E01, UI/UX). */
export function InvitationStatusBadge({ status }: { status: InvitationStatus }) {
  const { label, variant } = LABELS[status];
  return <Badge variant={variant}>{label}</Badge>;
}
