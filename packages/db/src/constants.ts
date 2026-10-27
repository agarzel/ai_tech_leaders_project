// Entry point safe for client bundles: constants only, nothing that imports @mikro-orm/*.
export { USER_ROLES, type UserRole } from "./entities/auth/user.constants";

// Bookable text-session lengths in minutes (R01).
export const SESSION_LENGTHS = [25, 50] as const;
export type SessionLength = (typeof SESSION_LENGTHS)[number];

// A slot blocks this many minutes; also the minimum spacing between one mentor's slots.
export const SLOT_BLOCK_MINUTES = 50;

// A slot is bookable only when it starts at least this many hours ahead (D13).
export const BOOKING_LEAD_TIME_HOURS = 24;

// Prices are PLN only, stored in grosze (D12).
export const CURRENCY = "PLN";

// Stack tags a mentor can pick on the profile.
export const MENTOR_TAGS = ["TypeScript", "React", "Python", "AI agents"] as const;
export type MentorTag = (typeof MENTOR_TAGS)[number];

// Where a booking came from (A04 measurement): a share link, the public list, or unknown/tampered.
export const BOOKING_ENTRY_POINTS = ["link", "list", "unknown"] as const;
export type BookingEntryPoint = (typeof BOOKING_ENTRY_POINTS)[number];

// The booking state machine's stored statuses (spec E02); here so client-safe validators can use them.
export const BOOKING_STATUSES = ["pending_payment", "awaiting_acceptance", "confirmed", "declined", "expired", "payment_expired", "cancelled"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
