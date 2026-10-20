"use client";

import { useId } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@devmentor/ui/components/ui/field";
import { Textarea } from "@devmentor/ui/components/ui/textarea";

/** The longest question a booking carries (spec E02, Data Model `Booking.question`). */
export const QUESTION_MAX = 2000;
/** From this many characters left the counter is announced; before that it only sits in the hint. */
const ANNOUNCE_FROM = 200;

type QuestionFieldProps = {
  value: string;
  onChange: (value: string) => void;
  /** A message from the form or the server; being over the limit is the field's own message. */
  error?: string;
  disabled?: boolean;
  id?: string;
};

/**
 * The question to the mentor (spec E02, `/book/[slotId]`): plain text with a counter in the hint. The
 * limit is not enforced by cutting the text – a pasted question stays whole and the field says by how
 * much it is too long (the server checks again). Near the limit a polite live region announces the
 * characters left, otherwise the counter stays silent (C64).
 */
export function QuestionField({ value, onChange, error, disabled, id }: QuestionFieldProps) {
  const generated = useId();
  const base = id ?? generated;
  const remaining = QUESTION_MAX - value.length;
  const over = remaining < 0;
  const message = over ? `Shorten the question by ${(-remaining).toLocaleString("en-US")} characters.` : error;
  const announcement = remaining > ANNOUNCE_FROM ? "" : over ? `${(-remaining).toLocaleString("en-US")} characters over the limit` : `${remaining.toLocaleString("en-US")} characters left`;

  return (
    <Field data-invalid={message ? true : undefined}>
      <FieldLabel htmlFor={base}>Your question</FieldLabel>
      <Textarea
        id={base}
        value={value}
        rows={8}
        disabled={disabled}
        aria-invalid={message ? true : undefined}
        aria-describedby={`${base}-hint${message ? ` ${base}-error` : ""}`}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldDescription id={`${base}-hint`}>
        The mentor reads this before deciding. Plain text, up to {QUESTION_MAX.toLocaleString("en-US")} characters ({value.length.toLocaleString("en-US")} used). Paste error messages and code as text.
      </FieldDescription>
      <span role="status" className="sr-only">
        {announcement}
      </span>
      {message && <FieldError id={`${base}-error`}>{message}</FieldError>}
    </Field>
  );
}
