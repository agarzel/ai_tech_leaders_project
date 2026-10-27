"use client";

import { useId, useState } from "react";
import { apiCall } from "../../backend/api/apiCall";
import type { ApiError } from "../../backend/api/types";
import { ErrorMessage } from "../../backend/feedback/ErrorMessage";
import { Button } from "../ui/button";

export type SessionNote = { status: "draft" | "approved" | "rejected"; body: string };

/**
 * The mentee's part of the session note (spec E03 S04): a draft is shown in full with Approve and Reject;
 * once approved it stays visible; a rejected note is never shown here (the server does not return it).
 */
export function SessionNotePanel({ bookingId, mentorName, note: initial }: { bookingId: string; mentorName: string; note: SessionNote }) {
  const id = useId();
  const [note, setNote] = useState(initial);
  const [busy, setBusy] = useState<"approve" | "reject">();
  const [error, setError] = useState<ApiError>();

  async function decide(decision: "approve" | "reject") {
    setBusy(decision);
    setError(undefined);
    const result = await apiCall<SessionNote>(`/api/bookings/${bookingId}/note/approve`, { method: "POST", body: { decision } });
    setBusy(undefined);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNote(result.data);
  }

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-in-group">
      <h2 id={`${id}-title`} className="type-section-title">
        Session note
      </h2>

      {note.status === "draft" ? (
        <>
          <p className="text-muted-foreground">
            {mentorName} wrote a note after the session. It is shown to you only if you approve it.
          </p>
          <p className="whitespace-pre-wrap">{note.body}</p>
          {error && <ErrorMessage title="Could not save your decision" error={error} />}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy !== undefined} aria-busy={busy === "approve" || undefined} onClick={() => decide("approve")}>
              {busy === "approve" ? "Approving…" : "Approve"}
            </Button>
            <Button type="button" variant="outline" disabled={busy !== undefined} aria-busy={busy === "reject" || undefined} onClick={() => decide("reject")}>
              {busy === "reject" ? "Rejecting…" : "Reject"}
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">You approved this note from {mentorName}.</p>
          <p className="whitespace-pre-wrap">{note.body}</p>
        </>
      )}
    </section>
  );
}
