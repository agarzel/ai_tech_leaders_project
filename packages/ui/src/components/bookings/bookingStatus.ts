import { formatDateTime, formatZoneLabel } from "@devmentor/ui/lib/format";
import type { Booking, BookingStatus, PaymentStatus } from "./types";

/** Who is reading: the mentee who paid or the mentor who decides. */
export type BookingAudience = "mentee" | "mentor";

type RefundPhase = "pending" | "refunded" | "failed";

/** Where the refund stands, from the payment (spec E02, "Refund lifecycle"). Anything not yet final reads as "on its way". */
function refundPhase(payment: PaymentStatus): RefundPhase {
  if (payment === "refunded") return "refunded";
  if (payment === "refund_failed") return "failed";
  return "pending";
}

const REFUND_SUFFIX: Record<RefundPhase, string> = {
  pending: "refund on its way",
  refunded: "refunded",
  failed: "refund delayed",
};

/** Short status for a row or badge, in words (WCAG 1.4.1); the refund wording follows the payment. */
export function bookingStatusLabel(status: BookingStatus, payment: PaymentStatus): string {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment";
    case "awaiting_acceptance":
      return "Awaiting mentor";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return `Declined · ${REFUND_SUFFIX[refundPhase(payment)]}`;
    case "expired":
      return `Expired · ${REFUND_SUFFIX[refundPhase(payment)]}`;
    case "payment_expired":
      return "Payment not completed";
    case "cancelled":
      // A payment still "paid" after cancelling means the mentor keeps it (cancelled after the free period).
      return payment === "paid" ? "Cancelled · no refund" : `Cancelled · ${REFUND_SUFFIX[refundPhase(payment)]}`;
  }
}

/** The mentor's short status: no refund wording – the mentor never sees payment details (C68, Q14). */
export function mentorStatusLabel(status: BookingStatus): string {
  switch (status) {
    case "pending_payment":
      return "Awaiting payment";
    case "awaiting_acceptance":
      return "Awaiting your decision";
    case "confirmed":
      return "Confirmed";
    case "declined":
      return "Declined";
    case "expired":
      return "Expired";
    case "payment_expired":
      return "Payment not completed";
    case "cancelled":
      return "Cancelled by the mentee";
  }
}

export type BookingDescription = { title: string; text: string };

const BANKS = "Banks take a few days to show it.";

/**
 * The status as a title and one sentence – the wording of spec E02 (UI/UX `/bookings/[id]`), per state
 * and reader. `pending_payment` has no description: it is `PaymentPending`. The mentor never reads
 * refund details, only that the mentee is refunded.
 */
export function describeBooking(booking: Booking, audience: BookingAudience, timeZone: string): BookingDescription {
  const { status, mentor } = booking;
  const refund = refundPhase(booking.paymentStatus);
  const when = formatDateTime(booking.startsAt, timeZone);
  const zone = formatZoneLabel(timeZone, new Date(booking.startsAt));
  const decideBy = booking.acceptBy ? `${formatDateTime(booking.acceptBy, timeZone)} (${formatZoneLabel(timeZone, new Date(booking.acceptBy))})` : "";

  if (audience === "mentor") {
    if (status === "awaiting_acceptance") {
      return {
        title: `Waiting for your decision — decide by ${decideBy}`,
        text: "Read the question, then accept or decline. If you do not decide in time, the booking expires and the mentee is refunded in full.",
      };
    }
    if (status === "confirmed") return { title: "Confirmed", text: `The session is on ${when} (${zone}).` };
    if (status === "declined") return { title: "You declined this booking", text: "The mentee gets a full refund." };
    if (status === "expired") return { title: "This booking expired", text: "You did not decide in time. The mentee gets a full refund." };
    if (status === "cancelled") return { title: "The mentee cancelled", text: "The session will not take place. The slot is released." };
  }

  switch (status) {
    case "awaiting_acceptance":
      return {
        title: `Waiting for ${mentor.name} — they decide by ${decideBy}`,
        text: `${mentor.name} reads your question and decides. If they decline, or do not answer in time, you get a full refund.`,
      };
    case "confirmed":
      return { title: "Confirmed", text: `Your session with ${mentor.name} is on ${when} (${zone}).` };
    case "declined":
    case "expired": {
      const lead = status === "declined" ? `${mentor.name} declined.` : `${mentor.name} did not decide in time.`;
      if (refund === "refunded") return { title: "Refunded", text: `${lead} The full amount went back to your card. ${BANKS}` };
      if (refund === "failed") return { title: "Refund delayed — we are on it", text: `${lead} The refund has not gone through yet. You do not need to do anything.` };
      return {
        title: status === "declined" ? "Declined — refund on its way" : "Expired — refund on its way",
        text: `${lead} The full amount goes back to your card. ${BANKS}`,
      };
    }
    case "cancelled": {
      if (booking.paymentStatus === "paid") {
        return { title: "Cancelled — no refund", text: `You cancelled after the free period, so ${mentor.name} keeps the payment. The session will not take place.` };
      }
      if (refund === "refunded") return { title: "Cancelled — refunded", text: `The full amount went back to your card. ${BANKS}` };
      if (refund === "failed") return { title: "Cancelled — refund delayed", text: "The refund has not gone through yet. You do not need to do anything." };
      return { title: "Cancelled — refund on its way", text: `The full amount goes back to your card. ${BANKS}` };
    }
    default: {
      // payment_expired (pending_payment is shown by PaymentPending): normally nothing was charged; a payment that arrived late is refunded.
      if (refund === "refunded") return { title: "Refunded", text: `The payment arrived after the time was released. The full amount went back to your card. ${BANKS}` };
      if (refund === "failed") return { title: "Refund delayed — we are on it", text: "The payment arrived after the time was released. The refund has not gone through yet. You do not need to do anything." };
      if (booking.paymentStatus === "refund_requested") {
        return { title: "Payment arrived too late — refund on its way", text: `The time was already released. The full amount goes back to your card. ${BANKS}` };
      }
      return {
        title: "Payment not completed — the time was released",
        text: "The payment was not completed in time, so another person can book this time now. Nothing was charged.",
      };
    }
  }
}
