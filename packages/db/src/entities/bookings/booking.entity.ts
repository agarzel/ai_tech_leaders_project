import { defineEntity, p, type InferEntity } from "@mikro-orm/core";
import { BOOKING_ENTRY_POINTS, BOOKING_STATUSES, CURRENCY, type BookingEntryPoint, type BookingStatus, type SessionLength } from "../../constants";
import { User } from "../auth/user.entity";
import { Slot } from "../availability/slot.entity";
import { baseProperties } from "../base.entity";
import { defineSingletonEntity } from "../define";
import { MentorProfile } from "../mentors/mentor-profile.entity";

// Defined in constants.ts (client-safe); re-exported with the entity.
export { BOOKING_STATUSES, type BookingStatus };

// States that occupy a slot; the hand-written partial unique index on slot_id covers exactly these.
export const LIVE_BOOKING_STATUSES = ["pending_payment", "awaiting_acceptance", "confirmed"] as const satisfies readonly BookingStatus[];

// Defined in constants.ts so client-safe validators can use them; re-exported here for the entity barrel.
export { BOOKING_ENTRY_POINTS, type BookingEntryPoint };

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
      // Set when the mentee cancels a confirmed booking (E03 S02); `mentee_free` refunds, `mentee_late` keeps the payment for the mentor.
      cancelledAt: p.datetime().nullable(),
      cancelReason: p.string().length(20).nullable(),
    },
    // One live booking per slot: a partial unique index, so cancelled or expired bookings free the slot again.
    uniques: [
      {
        name: "bookings_slot_id_live_unique",
        properties: ["slot"],
        where: { status: { $in: [...LIVE_BOOKING_STATUSES] } },
      },
    ],
    indexes: [
      { name: "bookings_status_accept_by_index", properties: ["status", "acceptBy"] },
      { name: "bookings_status_hold_expires_at_index", properties: ["status", "holdExpiresAt"] },
    ],
  }),
);

export type IBooking = InferEntity<typeof Booking>;
