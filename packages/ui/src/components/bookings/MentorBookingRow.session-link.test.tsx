import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MentorBookingRow } from "./MentorBookingRow";
import type { MentorBooking } from "./types";

const ZONE = "Europe/Warsaw";
const NOW = new Date("2026-11-03T12:00:00Z");

const booking = (overrides: Partial<MentorBooking> = {}): MentorBooking => ({
  id: "b1",
  mentee: { name: "Ada Lovelace" },
  startsAt: "2026-11-04T17:00:00Z",
  lengthMinutes: 25,
  priceAmount: 18000,
  currency: "PLN",
  status: "confirmed",
  acceptBy: null,
  declineReason: null,
  question: "Why does this fail?",
  ...overrides,
});

function renderRow(booking: MentorBooking, sessionHref?: string) {
  render(
    <MentorBookingRow
      booking={booking}
      timeZone={ZONE}
      now={NOW}
      onAccept={vi.fn()}
      onDecline={vi.fn()}
      sessionHref={sessionHref}
    />,
  );
}

describe("MentorBookingRow session link", () => {
  it("links a confirmed booking to its session page", () => {
    renderRow(booking(), "/mentor/bookings/b1");

    expect(screen.getByRole("link", { name: "Open session" })).toHaveAttribute("href", "/mentor/bookings/b1");
  });

  it("does not link a booking that is not confirmed", () => {
    renderRow(booking({ status: "declined" }), "/mentor/bookings/b1");

    expect(screen.queryByRole("link", { name: "Open session" })).not.toBeInTheDocument();
  });

  it("shows no link without a session page", () => {
    renderRow(booking());

    expect(screen.queryByRole("link", { name: "Open session" })).not.toBeInTheDocument();
  });
});
