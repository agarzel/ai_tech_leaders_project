import { z } from "zod";

export const DECLINE_REASON_MAX_LENGTH = 280;

// POST /api/mentor/bookings/[id]/decline. The reason is optional and shown to the mentee.
export const bookingDeclineSchema = z.object({
  reason: z.string("The reason must be text").trim().max(DECLINE_REASON_MAX_LENGTH, `The reason must be at most ${DECLINE_REASON_MAX_LENGTH} characters`).optional(),
});

export type BookingDeclineInput = z.infer<typeof bookingDeclineSchema>;
