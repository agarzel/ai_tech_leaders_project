import { useId, type ReactNode } from "react";
import { describeBooking, type BookingAudience } from "./bookingStatus";
import { PaymentPending, type PaymentPendingPhase } from "./PaymentPending";
import type { Booking } from "./types";

export type { BookingAudience } from "./bookingStatus";

type BookingStatusPanelProps = {
  booking: Booking;
  audience: BookingAudience;
  timeZone: string;
  /** For a booking still awaiting payment: how long the page has been checking (the page counts, `PaymentPending` shows). */
  pendingPhase?: PaymentPendingPhase;
  /** The next action, if any (*Find another mentor*, *Choose a time*); the page picks it and decides what is the accent. */
  actions?: ReactNode;
};

/**
 * Status and next action above the fold of `/bookings/[id]` (R01.5, P5/K3; spec E02 UI/UX): one title
 * that says where the booking stands, one sentence of what happens next, the mentor's reason when
 * there is one, and the action. Wording per state and reader lives in `describeBooking`. A booking
 * awaiting payment is `PaymentPending`.
 */
export function BookingStatusPanel({ booking, audience, timeZone, pendingPhase = "checking", actions }: BookingStatusPanelProps) {
  const titleId = useId();
  if (booking.status === "pending_payment") return <PaymentPending phase={pendingPhase} />;

  const { title, text } = describeBooking(booking, audience, timeZone);
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-in-group">
      <h2 id={titleId} className="type-section-title">
        {title}
      </h2>
      <p className="max-w-prose type-body text-muted-foreground">{text}</p>
      {audience === "mentee" && booking.declineReason && (
        <p className="max-w-prose break-words type-body">
          <span className="text-muted-foreground">Reason from {booking.mentor.name}: </span>
          {booking.declineReason}
        </p>
      )}
      {actions && <div className="flex flex-wrap items-center gap-in-group pt-in-group">{actions}</div>}
    </section>
  );
}
