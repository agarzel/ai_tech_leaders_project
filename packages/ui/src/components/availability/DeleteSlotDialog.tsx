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
import { formatDateTime, formatZoneLabel } from "@devmentor/ui/lib/format";
import type { Slot } from "./types";

type DeleteSlotDialogProps = {
  slot: Slot;
  timeZone: string;
  /** `apiCall("/api/mentor/slots/" + slot.id, { method: "DELETE" })`. A booked slot answers `conflict` ("Cancel the booking instead"). */
  onConfirm: (slot: Slot) => Promise<ApiResult<unknown>>;
  /** After the server confirmed the deletion – the row should leave the list and focus needs a new home. */
  onDeleted?: (slot: Slot) => void;
  /** Opens the dialog at once (documentation previews and tests). */
  defaultOpen?: boolean;
};

/**
 * The delete-with-confirmation pattern for a slot (spec E01, Edge Cases "Deleting a slot"): the question
 * names the object and the time, the buttons are verbs (*Keep slot* / *Delete slot*). Focus starts on
 * the safe choice (B51). While the request runs nothing can close the dialog; a refusal stays inside it
 * in words, so the mentor sees why and can still back out (C58).
 */
export function DeleteSlotDialog({ slot, timeZone, onConfirm, onDeleted, defaultOpen = false }: DeleteSlotDialogProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const label = formatDateTime(slot.startsAt, timeZone);

  async function confirm() {
    setIsDeleting(true);
    setError(null);
    const result = await onConfirm(slot);
    setIsDeleting(false);
    if (result.ok) {
      setOpen(false);
      onDeleted?.(slot);
      return;
    }
    setError(result.error);
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (isDeleting) return;
        setOpen(next);
        setError(null);
      }}
    >
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" aria-label={`Delete the slot on ${label}`} />}>Delete</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the slot on {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            Mentees can no longer book this time ({formatZoneLabel(timeZone, new Date(slot.startsAt))}). You can add it again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <ErrorMessage title="Could not delete the slot" error={error} />}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Keep slot</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isDeleting} aria-busy={isDeleting || undefined} onClick={() => void confirm()}>
            {isDeleting && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
            {isDeleting ? "Deleting…" : "Delete slot"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
