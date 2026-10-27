"use client";

import { useId, useState, type FormEvent } from "react";
import { apiCall } from "../../backend/api/apiCall";
import type { ApiError } from "../../backend/api/types";
import { ErrorMessage } from "../../backend/feedback/ErrorMessage";
import { Button } from "../ui/button";
import { Field, FieldDescription, FieldLabel } from "../ui/field";
import { Textarea } from "../ui/textarea";

export type ThreadMessage = { id: string; authorId: string; body: string; createdAt: string };

type SessionThreadProps = {
  bookingId: string;
  viewerId: string;
  counterpartName: string;
  timeZone: string;
  messages: ThreadMessage[];
  /** False outside the session window: the thread is read-only then (decided on the server). */
  canWrite: boolean;
};

const timeFormat = (timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone });

/**
 * The text thread of a confirmed booking (spec E03 S01). Messages are listed oldest first with the
 * author and the time in the viewer's zone; the composer appears only while the session window is open.
 */
export function SessionThread({ bookingId, viewerId, counterpartName, timeZone, messages: initial, canWrite }: SessionThreadProps) {
  const id = useId();
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError>();
  const format = timeFormat(timeZone);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    const result = await apiCall<ThreadMessage>(`/api/bookings/${bookingId}/messages`, { method: "POST", body: { body: draft } });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages((current) => [...current, result.data]);
    setDraft("");
  }

  return (
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
      <h2 id={`${id}-title`} className="text-lg font-semibold">
        Session thread
      </h2>

      {messages.length === 0 ? (
        <p className="text-muted-foreground">No messages yet.</p>
      ) : (
        <ol className="flex flex-col divide-y divide-border">
          {messages.map((message) => (
            <li key={message.id} className="flex flex-col gap-1 py-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{message.authorId === viewerId ? "You" : counterpartName}</span>
                {" · "}
                <time dateTime={message.createdAt}>{format.format(new Date(message.createdAt))}</time>
              </p>
              <p className="whitespace-pre-wrap">{message.body}</p>
            </li>
          ))}
        </ol>
      )}

      {canWrite ? (
        <form onSubmit={send} className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor={`${id}-body`}>Message</FieldLabel>
            <Textarea id={`${id}-body`} rows={4} value={draft} onChange={(event) => setDraft(event.target.value)} />
            <FieldDescription>Plain text, during the session only. Shared with the other person in this booking.</FieldDescription>
          </Field>
          {error && <ErrorMessage title="Could not send the message" error={error} />}
          <div>
            <Button type="submit" disabled={busy || draft.trim().length === 0} aria-busy={busy || undefined}>
              {busy ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">The thread is read-only now. Messages can be sent only during the session.</p>
      )}
    </section>
  );
}
