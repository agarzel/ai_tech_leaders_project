"use client";

import { useState } from "react";
import type { ApiError, ApiResult } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@devmentor/ui/components/ui/alert-dialog";
import { Button } from "@devmentor/ui/components/ui/button";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { formatDateTime } from "@devmentor/ui/lib/format";

type CancelBookingDialogProps = {
  mentorName: string;
  /** The last moment a cancellation is refunded in full, computed on the server (ISO UTC). */
  freeUntil: string;
  /** False after `freeUntil`: the mentor keeps the payment. */
  refundable: boolean;
  timeZone: string;
  /** `apiCall("/api/bookings/" + id + "/cancel", { method: "POST" })`. */
  onConfirm: () => Promise<ApiResult<unknown>>;
  /** After the server confirmed: the booking is cancelled and the page shows the outcome. */
  onCancelled?: () => void;
};

/**
 * Cancelling a confirmed booking (spec E03 S02): an irreversible action with no input, so an AlertDialog.
 * The sentence names the deadline and what happens after it; the server decides the outcome. A refusal
 * (the session already started) stays in the dialog in words.
 */
export function CancelBookingDialog({ mentorName, freeUntil, refundable, timeZone, onConfirm, onCancelled }: CancelBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function confirm() {
    setIsCancelling(true);
    setError(null);
    const result = await onConfirm();
    setIsCancelling(false);
    if (result.ok) {
      setOpen(false);
      onCancelled?.();
      return;
    }
    setError(result.error);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isCancelling) return;
        setOpen(next);
        setError(null);
      }}
    >
      <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>Cancel booking</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
          <AlertDialogDescription>
            {refundable
              ? `Free cancellation until ${formatDateTime(freeUntil, timeZone)}: you get a full refund and the slot is released.`
              : `The free cancellation period has ended. ${mentorName} keeps the payment, and the slot is released.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <ErrorMessage title="Could not cancel the booking" error={error} />}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isCancelling}>Keep booking</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isCancelling} aria-busy={isCancelling || undefined} onClick={() => void confirm()}>
            {isCancelling && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
            {isCancelling ? "Cancelling…" : "Cancel booking"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
