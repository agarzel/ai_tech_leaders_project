"use client";

import { useId } from "react";
import { CopyField } from "@devmentor/ui/backend/forms/CopyField";
import { Button } from "@devmentor/ui/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@devmentor/ui/components/ui/card";
import { formatDateTime, formatZoneLabel } from "@devmentor/ui/lib/format";

type InvitationLinkPanelProps = {
  email: string;
  /** The link with the raw token – returned only by `POST /api/admin/invitations` and never again (spec E01). */
  link: string;
  expiresAt: string;
  timeZone: string;
  /** The admin has copied the link; the parent drops it from memory and shows the list again. */
  onDone: () => void;
};

/**
 * The new invitation link, shown once with a copy button (spec E01, `/admin/invitations`; pattern "Link
 * shown once"). The founder sends it to the mentor themselves – DevMentor sends no email (D11, D15).
 */
export function InvitationLinkPanel({ email, link, expiresAt, timeZone, onDone }: InvitationLinkPanelProps) {
  const titleId = useId();
  return (
    <Card role="region" aria-labelledby={titleId}>
      <CardHeader>
        <CardTitle id={titleId} className="break-words">
          Invitation for {email}
        </CardTitle>
        <CardDescription>
          Copy the link now and send it to the mentor yourself. It is shown only once and works until{" "}
          {formatDateTime(expiresAt, timeZone)} ({formatZoneLabel(timeZone, new Date(expiresAt))}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CopyField label="Invitation link" value={link} autoFocus />
      </CardContent>
      <CardFooter>
        <Button onClick={onDone}>Done</Button>
      </CardFooter>
    </Card>
  );
}
