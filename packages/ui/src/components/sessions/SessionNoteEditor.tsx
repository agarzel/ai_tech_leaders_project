"use client";

import { useId, useState, type FormEvent } from "react";
import { apiCall } from "../../backend/api/apiCall";
import type { ApiError } from "../../backend/api/types";
import { ErrorMessage } from "../../backend/feedback/ErrorMessage";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";
import type { SessionNote } from "./SessionNotePanel";

type SessionNoteEditorProps = {
  bookingId: string;
  /** The mentor's own note, in any state; null when none was written yet. */
  note: SessionNote | null;
  /** The session has ended and the note is still a draft (decided on the server). */
  canWrite: boolean;
};

/**
 * The mentor's part of the session note (spec E03 S04). A draft can be written after the session ends and
 * waits for the mentee's approval; a decided note is final and is shown here read-only.
 */
export function SessionNoteEditor({ bookingId, note: initial, canWrite }: SessionNoteEditorProps) {
  const id = useId();
  const [note, setNote] = useState(initial);
  const [draft, setDraft] = useState(initial?.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const result = await apiCall<SessionNote>(`/api/mentor/bookings/${bookingId}/note`, { method: "PUT", body: { body: draft } });
    setBusy(false);
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

      {note?.status === "approved" && (
        <>
          <p className="text-muted-foreground">The mentee approved this note.</p>
          <p className="whitespace-pre-wrap">{note.body}</p>
        </>
      )}

      {note?.status === "rejected" && (
        <>
          <p className="text-muted-foreground">The mentee rejected this note. It is not shown to them.</p>
          <p className="whitespace-pre-wrap">{note.body}</p>
        </>
      )}

      {note?.status !== "approved" && note?.status !== "rejected" && canWrite && (
        <form onSubmit={save} className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor={`${id}-body`}>Your note</FieldLabel>
            <Textarea id={`${id}-body`} rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} />
            <FieldDescription>Optional. Shown to the mentee only after they approve it.</FieldDescription>
          </Field>
          {error && <ErrorMessage title="Could not save the note" error={error} />}
          <div>
            <Button type="submit" disabled={busy || draft.trim().length === 0} aria-busy={busy || undefined}>
              {busy ? "Saving…" : note ? "Save note" : "Write note"}
            </Button>
          </div>
        </form>
      )}

      {note?.status === "draft" && !canWrite && (
        <>
          <p className="text-muted-foreground">Waiting for the mentee to approve this note.</p>
          <p className="whitespace-pre-wrap">{note.body}</p>
        </>
      )}

      {!note && !canWrite && <p className="text-muted-foreground">You can write a note after the session ends.</p>}
    </section>
  );
}
