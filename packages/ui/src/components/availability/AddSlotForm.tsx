"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ApiError, ApiResult } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Button } from "@devmentor/ui/components/ui/button";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { SlotTimeField } from "./SlotTimeField";
import type { Slot } from "./types";

type AddSlotFormProps = {
  /** The mentor's zone (`browserTimeZone()` in the app), shown on the form. */
  timeZone: string;
  /** `apiCall("/api/mentor/slots", { method: "POST", body: { startsAt } })`. */
  onSubmit: (startsAt: string) => Promise<ApiResult<Slot>>;
  /** After the server confirmed the new slot. */
  onAdded?: (slot: Slot) => void;
};

/**
 * Adds one slot (spec E01, `/mentor/slots`). The form only converts the local date and time (DST rules
 * in `SlotTimeField`); the 24 h lead, 60-day horizon, 15-minute grid, 50-minute spacing and duplicate
 * rules are the server's, shown at the field as the server words them (C55). Behaviour follows the Form
 * pattern: values kept after an error, one submit at a time, "added" only after the server confirms;
 * after success the fields are cleared and focus returns to the date.
 */
export function AddSlotForm({ timeZone, onSubmit, onAdded }: AddSlotFormProps) {
  const id = useId();
  const [startsAt, setStartsAt] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string>();
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const pendingFocus = useRef(false);

  useEffect(() => {
    if (!pendingFocus.current) return;
    (document.getElementById(`${id}-date`) as HTMLElement).focus();
    pendingFocus.current = false;
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setFormError(null);
    setAdded(false);
    if (startsAt === null) {
      setFieldError("Choose a date and a time for the slot.");
      pendingFocus.current = true;
      return;
    }
    setIsSaving(true);
    const result = await onSubmit(startsAt);
    setIsSaving(false);
    if (result.ok) {
      setFieldError(undefined);
      setStartsAt(null);
      setResetKey((key) => key + 1);
      setAdded(true);
      pendingFocus.current = true;
      onAdded?.(result.data);
      return;
    }
    const message = result.error.fieldErrors?.startsAt?.[0];
    setFieldError(message);
    if (!message) setFormError(result.error);
    pendingFocus.current = true;
  }

  return (
    <form noValidate onSubmit={submit} className="flex max-w-xl flex-col gap-between-groups">
      {formError && <ErrorMessage title="Could not add the slot" error={formError} />}
      <SlotTimeField
        key={resetKey}
        id={id}
        timeZone={timeZone}
        error={fieldError}
        disabled={isSaving}
        onChange={(value) => {
          setStartsAt(value);
          setFieldError(undefined);
          setAdded(false);
        }}
      />
      <div className="flex flex-wrap items-center gap-between-groups">
        <Button type="submit" disabled={isSaving} aria-busy={isSaving || undefined}>
          {isSaving && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
          {isSaving ? "Adding…" : "Add slot"}
        </Button>
        <p role="status" className="type-body text-muted-foreground">
          {added ? "Slot added." : ""}
        </p>
      </div>
    </form>
  );
}
