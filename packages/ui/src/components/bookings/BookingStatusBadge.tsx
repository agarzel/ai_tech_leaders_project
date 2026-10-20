import { Badge } from "@devmentor/ui/components/ui/badge";
import { bookingStatusLabel } from "./bookingStatus";
import type { BookingStatus, PaymentStatus } from "./types";

/**
 * The booking's status in a row (`/bookings`, `/mentor/bookings`): words from the state machine and the
 * payment's refund phase, never colour alone. Neutral or outline – the accent is not a status (T10);
 * only *Confirmed* is `secondary`, everything unfinished or ended is `outline`.
 */
export function BookingStatusBadge({ status, paymentStatus }: { status: BookingStatus; paymentStatus: PaymentStatus }) {
  return <Badge variant={status === "confirmed" ? "secondary" : "outline"}>{bookingStatusLabel(status, paymentStatus)}</Badge>;
}
