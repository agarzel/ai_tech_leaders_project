import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { CURRENCY, type SessionLength } from "../../constants";
import { User } from "../auth/user.entity";
import { Slot } from "../availability/slot.entity";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";
import { MentorProfile } from "../mentors/mentor-profile.entity";

export const BOOKING_STATUSES = [
  "pending_payment",
  "awaiting_acceptance",
  "confirmed",
  "declined",
  "expired",
  "payment_expired",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// States that occupy a slot; the hand-written partial unique index on slot_id covers exactly these.
export const LIVE_BOOKING_STATUSES = ["pending_payment", "awaiting_acceptance", "confirmed"] as const satisfies readonly BookingStatus[];

export const BOOKING_ENTRY_POINTS = ["link", "list", "unknown"] as const;
export type BookingEntryPoint = (typeof BOOKING_ENTRY_POINTS)[number];

export const Booking = defineSingletonEntity("Booking", () =>
  defineEntity({
    name: "Booking",
    tableName: "bookings",
    properties: {
      ...baseProperties(),
      // Bookings are history: deleting a slot, mentee or mentor profile is refused while they exist.
      slot: () => p.manyToOne(Slot).deleteRule("restrict"),
      mentee: () => p.manyToOne(User).deleteRule("restrict"),
      // Denormalized from the slot for the mentor's list.
      mentor: () => p.manyToOne(MentorProfile).deleteRule("restrict"),
      lengthMinutes: p.integer().$type<SessionLength>(),
      // Integer grosze computed server-side at booking time; later price changes never touch it.
      priceAmount: p.integer(),
      currency: p.string().length(3).default(CURRENCY),
      // Up to 2,000 characters (validated in the service); frozen after creation, never logged.
      question: p.text(),
      status: p.string().$type<BookingStatus>().default("pending_payment"),
      holdExpiresAt: p.datetime(),
      // Null until the booking is paid.
      acceptBy: p.datetime().nullable(),
      entryPoint: p.string().$type<BookingEntryPoint>().default("unknown"),
      decidedAt: p.datetime().nullable(),
      // Optional mentor text, up to 280 characters (validated in the service).
      declineReason: p.string().length(280).nullable(),
    },
    indexes: [
      { name: "bookings_status_accept_by_index", properties: ["status", "acceptBy"] },
      { name: "bookings_status_hold_expires_at_index", properties: ["status", "holdExpiresAt"] },
    ],
  }),
);

export type IBooking = InferEntity<typeof Booking>;
