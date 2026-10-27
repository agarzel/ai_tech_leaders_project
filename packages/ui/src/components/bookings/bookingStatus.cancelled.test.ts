import { describe, expect, it } from "vitest";
import { bookingStatusLabel, describeBooking, mentorStatusLabel } from "./bookingStatus";
import type { Booking, PaymentStatus } from "./types";

const ZONE = "Europe/Warsaw";

const booking = (paymentStatus: PaymentStatus): Booking => ({
  id: "b1",
  mentor: { name: "Marek Zieliński", slug: "marek" },
  startsAt: "2026-11-04T17:00:00Z",
  lengthMinutes: 25,
  priceAmount: 18000,
  currency: "PLN",
  status: "cancelled",
  paymentStatus,
  acceptBy: null,
  declineReason: null,
  question: "Why does this fail?",
});

describe("cancelled bookings", () => {
  it.each([
    ["paid", "Cancelled · no refund"],
    ["refunded", "Cancelled · refunded"],
    ["refund_failed", "Cancelled · refund delayed"],
    ["refund_requested", "Cancelled · refund on its way"],
  ] as const)("labels a payment that is %s for the mentee", (payment, label) => {
    expect(bookingStatusLabel("cancelled", payment)).toBe(label);
  });

  it("labels the mentor's view without refund details", () => {
    expect(mentorStatusLabel("cancelled")).toBe("Cancelled by the mentee");
  });

  it("tells the mentee that the mentor keeps a late cancellation's payment", () => {
    expect(describeBooking(booking("paid"), "mentee", ZONE)).toMatchObject({ title: "Cancelled — no refund" });
  });

  it.each([
    ["refunded", "Cancelled — refunded"],
    ["refund_failed", "Cancelled — refund delayed"],
    ["refund_requested", "Cancelled — refund on its way"],
  ] as const)("describes a cancelled booking whose payment is %s to the mentee", (payment, title) => {
    expect(describeBooking(booking(payment), "mentee", ZONE)).toMatchObject({ title });
  });

  it("tells the mentor the slot is released, without refund wording", () => {
    const description = describeBooking(booking("paid"), "mentor", ZONE);

    expect(description.title).toBe("The mentee cancelled");
    expect(description.text).not.toMatch(/refund/i);
  });
});
