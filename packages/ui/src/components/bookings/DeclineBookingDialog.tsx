"use client";

import { useId, useState } from "react";
import type { ApiError, ApiResult } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Button } from "@devmentor/ui/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@devmentor/ui/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@devmentor/ui/components/ui/field";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { Textarea } from "@devmentor/ui/components/ui/textarea";
import { formatDateTime } from "@devmentor/ui/lib/format";

/** The longest reason the mentee sees (spec E02, Data Model `declineReason`). */
export const REASON_MAX = 280;

type DeclineBookingDialogProps = {
  menteeName: string;
  startsAt: string;
  timeZone: string;
  /** `apiCall("/api/mentor/bookings/" + id + "/decline", { method: "POST", body })`; `reason` is left out when empty. */
  onConfirm: (values: { reason?: string }) => Promise<ApiResult<unknown>>;
  /** After the server confirmed: the booking is declined and refunded. */
  onDeclined?: () => void;
  /** Opens the dialog at once (documentation previews and tests). */
  defaultOpen?: boolean;
};

/**
 * Declining a booking (spec E02, UI/UX `/mentor/bookings`): the question names the mentee, the sentence
 * says the mentee is refunded in full, and an optional reason up to 280 characters is shown to the
 * mentee. A refusal (already accepted in another tab, deadline passed) stays in the dialog in words.
 * Focus starts on the safe choice (B51); nothing can close the dialog while the request runs (C69).
 */
export function DeclineBookingDialog({ menteeName, startsAt, timeZone, onConfirm, onDeclined, defaultOpen = false }: DeclineBookingDialogProps) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [reason, setReason] = useState("");
  const [isDeclining, setIsDeclining] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const label = formatDateTime(startsAt, timeZone);
  const over = reason.length - REASON_MAX;

  async function confirm() {
    setIsDeclining(true);
    setError(null);
    const trimmed = reason.trim();
    const result = await onConfirm(trimmed ? { reason: trimmed } : {});
    setIsDeclining(false);
    if (result.ok) {
      setOpen(false);
      onDeclined?.();
      return;
    }
    setError(result.error);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isDeclining) return;
        setOpen(next);
        setError(null);
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" aria-label={`Decline ${menteeName}, ${label}`} />}>Decline</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline the booking from {menteeName}?</DialogTitle>
          <DialogDescription>The mentee gets a full refund and the slot is released.</DialogDescription>
        </DialogHeader>
        <Field data-invalid={over > 0 || undefined}>
          <FieldLabel htmlFor={`${id}-reason`} optional>
            Reason for the mentee
          </FieldLabel>
          <Textarea
            id={`${id}-reason`}
            value={reason}
            rows={4}
            disabled={isDeclining}
            aria-invalid={over > 0 || undefined}
            aria-describedby={`${id}-hint${over > 0 ? ` ${id}-error` : ""}`}
            onChange={(event) => setReason(event.target.value)}
          />
          <FieldDescription id={`${id}-hint`}>
            Up to {REASON_MAX} characters ({reason.length} used). The mentee sees it.
          </FieldDescription>
          {over > 0 && <FieldError id={`${id}-error`}>{`Shorten the reason by ${over} characters.`}</FieldError>}
        </Field>
        {error && <ErrorMessage title="Could not decline the booking" error={error} />}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={isDeclining} />}>Keep booking</DialogClose>
          <Button variant="destructive" disabled={isDeclining || over > 0} aria-busy={isDeclining || undefined} onClick={() => void confirm()}>
            {isDeclining && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
            {isDeclining ? "Declining…" : "Decline booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
