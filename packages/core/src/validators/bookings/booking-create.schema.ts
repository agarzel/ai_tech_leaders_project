import { z } from "zod";
import { BOOKING_ENTRY_POINTS, SESSION_LENGTHS } from "@devmentor/db/constants";

export const QUESTION_MAX_LENGTH = 2000;

// POST /api/bookings. The mentee is the caller and the price is computed server-side: neither is in the body.
export const bookingCreateSchema = z.object({
  slotId: z.string("Slot id is required").min(1, "Slot id is required"),
  lengthMinutes: z.union(
    SESSION_LENGTHS.map((length) => z.literal(length)),
    "Pick a session length",
  ),
  question: z
    .string("Write your question")
    .trim()
    .min(1, "Write your question")
    .max(QUESTION_MAX_LENGTH, `The question must be at most ${QUESTION_MAX_LENGTH} characters`),
  entryPoint: z.enum(BOOKING_ENTRY_POINTS, "Unknown entry point"),
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
