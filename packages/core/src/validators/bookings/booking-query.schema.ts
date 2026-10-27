import { z } from "zod";
import { BOOKING_STATUSES } from "@devmentor/db/constants";

export const BOOKINGS_DEFAULT_PAGE_SIZE = 20;
export const BOOKINGS_MAX_PAGE_SIZE = 50;

// GET /api/bookings?page&pageSize&status and GET /api/mentor/bookings?page&pageSize. Query values arrive as strings.
// An invalid value is rejected (fail closed); a pageSize above the maximum is clamped.
export const bookingListQuerySchema = z.object({
  page: z.coerce.number("Page must be a number").int("Page must be a whole number").min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce
    .number("Page size must be a number")
    .int("Page size must be a whole number")
    .min(1, "Page size must be at least 1")
    .transform((value) => Math.min(value, BOOKINGS_MAX_PAGE_SIZE))
    .default(BOOKINGS_DEFAULT_PAGE_SIZE),
  status: z.enum(BOOKING_STATUSES, "Pick one of the listed statuses").optional(),
});

export type BookingListQuery = z.infer<typeof bookingListQuerySchema>;
