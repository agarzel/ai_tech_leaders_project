"use client";

import { useState } from "react";
import type { ApiError, ApiResult } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { Badge } from "@devmentor/ui/components/ui/badge";
import { Button } from "@devmentor/ui/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@devmentor/ui/components/ui/item";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import { formatDateTime, formatPrice, formatZoneLabel } from "@devmentor/ui/lib/format";
import { AcceptDeadline } from "./AcceptDeadline";
import { BookingQuestion } from "./BookingQuestion";
import { mentorStatusLabel } from "./bookingStatus";
import { DeclineBookingDialog } from "./DeclineBookingDialog";
import type { MentorBooking } from "./types";

type MentorBookingRowProps = {
  booking: MentorBooking;
  timeZone: string;
  /** The page's clock (`useNow`). */
  now: Date;
  /** The booking with the nearest deadline: its *Accept* is the screen's one accent (Q3, C10). */
  isNext?: boolean;
  /** `apiCall("/api/mentor/bookings/" + id + "/accept", { method: "POST" })`; after `acceptBy` the server answers `conflict`. */
  onAccept: (booking: MentorBooking) => Promise<ApiResult<unknown>>;
  /** `apiCall(".../decline", { method: "POST", body })`. */
  onDecline: (booking: MentorBooking, values: { reason?: string }) => Promise<ApiResult<unknown>>;
  /** After the server confirmed either decision – the page reloads the list. */
  onDecided?: (booking: MentorBooking) => void;
};

/**
 * A booking in the mentor's list (`/mentor/bookings`, spec E02): the mentee by name only, the slot, the
 * question and – while it awaits a decision – the deadline with *Accept* and *Decline*. Decided or
 * expired bookings show their status instead of actions – in the mentor's words, never refund details (Q14). A refusal (deadline passed) appears under the
 * row in words (C69).
 */
export function MentorBookingRow({ booking, timeZone, now, isNext = false, onAccept, onDecline, onDecided }: MentorBookingRowProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const awaiting = booking.status === "awaiting_acceptance" && booking.acceptBy !== null;
  const time = formatDateTime(booking.startsAt, timeZone);

  async function accept() {
    setIsAccepting(true);
    setError(null);
    const result = await onAccept(booking);
    setIsAccepting(false);
    if (result.ok) {
      onDecided?.(booking);
      return;
    }
    setError(result.error);
  }

  return (
    <Item className="flex-wrap items-start">
      <ItemContent className="min-w-0 basis-64 gap-in-group">
        <ItemTitle>{booking.mentee.name}</ItemTitle>
        <ItemDescription>
          {time} ({formatZoneLabel(timeZone, new Date(booking.startsAt))}) · {booking.lengthMinutes} min ·{" "}
          <span className="tabular-nums">{formatPrice(booking.priceAmount, booking.currency)}</span>
        </ItemDescription>
        {awaiting && (
          <p className="type-meta text-muted-foreground">
            <AcceptDeadline acceptBy={booking.acceptBy as string} now={now} timeZone={timeZone} />
          </p>
        )}
        <BookingQuestion question={booking.question} collapsible />
        {error && <ErrorMessage title="Could not accept the booking" error={error} />}
      </ItemContent>
      <ItemActions>
        {awaiting ? (
          <>
            <Button
              variant={isNext ? "default" : "outline"}
              size="sm"
              disabled={isAccepting}
              aria-busy={isAccepting || undefined}
              aria-label={`Accept ${booking.mentee.name}, ${time}`}
              onClick={() => void accept()}
            >
              {isAccepting && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
              {isAccepting ? "Accepting…" : "Accept"}
            </Button>
            <DeclineBookingDialog
              menteeName={booking.mentee.name}
              startsAt={booking.startsAt}
              timeZone={timeZone}
              onConfirm={(values) => onDecline(booking, values)}
              onDeclined={() => onDecided?.(booking)}
            />
          </>
        ) : (
          <Badge variant={booking.status === "confirmed" ? "secondary" : "outline"}>{mentorStatusLabel(booking.status)}</Badge>
        )}
      </ItemActions>
    </Item>
  );
}
