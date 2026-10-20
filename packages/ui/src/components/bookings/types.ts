// Shapes from spec E02 (Data Model `Booking`/`Payment`, API Contracts `BookingDto`; plan 3.1). ui must not
// import core, so they are restated here (C1, C2). Amounts are grosze; times are ISO UTC strings.

/** The booking state machine (spec E02). `status` is the effective one: past `acceptBy` the server already reports `expired`. */
export type BookingStatus = "pending_payment" | "awaiting_acceptance" | "confirmed" | "declined" | "expired" | "payment_expired";

/** The payment's own lifecycle, including the refund (spec E02, "Refund lifecycle"). */
export type PaymentStatus = "creating" | "open" | "paid" | "expired" | "refund_requested" | "refunded" | "refund_failed";

/** Session lengths a mentor sells (R01, `SESSION_LENGTHS`). */
export type BookingLength = 25 | 50;

/** `BookingDto` as the mentee (or the mentor of that booking) reads it. */
export type Booking = {
  id: string;
  mentor: { name: string; slug: string };
  startsAt: string;
  lengthMinutes: BookingLength;
  /** Price stored when the booking was made; a later price change never touches it. */
  priceAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  /** Set once paid (`startsAt - 12 h`, R05). */
  acceptBy: string | null;
  /** Optional reason from the mentor, up to 280 characters. */
  declineReason: string | null;
  /** Plain text, up to 2,000 characters. */
  question: string;
};

/**
 * `MentorBookingDto` (spec E02): the mentor's view – the mentee by name only, never an email, and no
 * `paymentStatus`: the mentor never sees refund details (C68, owner decision Q14).
 */
export type MentorBooking = Omit<Booking, "mentor" | "paymentStatus"> & { mentee: { name: string } };
