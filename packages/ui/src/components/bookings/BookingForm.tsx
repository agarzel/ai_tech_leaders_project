"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ApiError, ApiResult } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Button } from "@devmentor/ui/components/ui/button";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { formatPrice } from "@devmentor/ui/lib/format";
import { BookingSummary, type BookingSummaryProps } from "./BookingSummary";
import { QUESTION_MAX, QuestionField } from "./QuestionField";

export type BookingStarted = { bookingId: string; checkoutUrl: string };

type BookingFormProps = {
  summary: BookingSummaryProps;
  /** `apiCall("/api/bookings", { method: "POST", body: { slotId, lengthMinutes, question, entryPoint } })`. */
  onSubmit: (values: { question: string }) => Promise<ApiResult<BookingStarted>>;
  /** The server created the booking and the payment page: the app leaves for `checkoutUrl`. */
  onStarted?: (started: BookingStarted) => void;
};

/**
 * `/book/[slotId]` (spec E02, UI/UX): the summary, the question, what happens next (the mentor may
 * decline – full refund; the time is held while paying), "Card payment" (D16) and *Pay {price}* – the
 * screen's one accent (R01.5, P5/K3). Behaviour follows the Form pattern: values kept after an error,
 * one submit at a time; after success the button stays busy until the browser leaves for the payment
 * page, so a second booking cannot be made by a double click (C65).
 */
export function BookingForm({ summary, onSubmit, onStarted }: BookingFormProps) {
  const id = useId();
  const [question, setQuestion] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [phase, setPhase] = useState<"idle" | "submitting" | "redirecting">("idle");
  const pendingFocus = useRef<string | null>(null);

  useEffect(() => {
    if (pendingFocus.current === null) return;
    (document.getElementById(pendingFocus.current) as HTMLElement).focus();
    pendingFocus.current = null;
  });

  const busy = phase !== "idle";
  const price = formatPrice(summary.priceAmount, summary.currency);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setFormError(null);
    const trimmed = question.trim();
    if (!trimmed || question.length > QUESTION_MAX) {
      setFieldError(trimmed ? undefined : "Write your question for the mentor.");
      (document.getElementById(`${id}-question`) as HTMLElement).focus();
      return;
    }
    setPhase("submitting");
    const result = await onSubmit({ question: trimmed });
    if (result.ok) {
      setPhase("redirecting");
      onStarted?.(result.data);
      return;
    }
    setPhase("idle");
    const message = result.error.fieldErrors?.question?.[0];
    setFieldError(message);
    if (!message) setFormError(result.error);
    pendingFocus.current = message ? `${id}-question` : `${id}-form-error`;
  }

  return (
    <form noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-section">
      {formError && (
        <div id={`${id}-form-error`} tabIndex={-1} className="outline-none">
          <ErrorMessage title="Could not start the payment" error={formError} />
        </div>
      )}
      <section aria-labelledby={`${id}-summary`} className="flex flex-col gap-in-group">
        <h2 id={`${id}-summary`} className="type-section-title">
          Your booking
        </h2>
        <BookingSummary {...summary} />
      </section>
      <QuestionField
        id={`${id}-question`}
        value={question}
        error={fieldError}
        disabled={busy}
        onChange={(value) => {
          setQuestion(value);
          setFieldError(undefined);
        }}
      />
      <section aria-labelledby={`${id}-next`} className="flex flex-col gap-in-group">
        <h2 id={`${id}-next`} className="type-section-title">
          Payment
        </h2>
        <p className="max-w-prose type-body">
          Card payment. You pay now to hold this time for 35 minutes; the payment page opens next.
        </p>
        <p className="max-w-prose type-body text-muted-foreground">
          The mentor reads your question and may decline it. If they decline, or do not answer in time, you get a full refund.
        </p>
      </section>
      <div className="flex flex-wrap items-center gap-between-groups">
        <Button type="submit" disabled={busy} aria-busy={busy || undefined}>
          {busy && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
          {phase === "idle" ? `Pay ${price}` : phase === "submitting" ? "Booking…" : "Opening payment…"}
        </Button>
        <p role="status" className="type-body text-muted-foreground">
          {phase === "redirecting" ? "Taking you to the payment page." : ""}
        </p>
      </div>
    </form>
  );
}
