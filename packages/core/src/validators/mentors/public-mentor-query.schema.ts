import { z } from "zod";
import { MENTOR_TAGS } from "@devmentor/db/constants";

export const PUBLIC_MENTORS_DEFAULT_PAGE_SIZE = 12;
export const PUBLIC_MENTORS_MAX_PAGE_SIZE = 50;

// GET /api/mentors?page&pageSize&tag. Query values arrive as strings. An invalid value is rejected (fail closed);
// a pageSize above the maximum is clamped, not rejected, so a client asking for "everything" gets the largest page.
export const publicMentorQuerySchema = z.object({
  page: z.coerce.number("Page must be a number").int("Page must be a whole number").min(1, "Page must be at least 1").default(1),
  pageSize: z.coerce
    .number("Page size must be a number")
    .int("Page size must be a whole number")
    .min(1, "Page size must be at least 1")
    .transform((value) => Math.min(value, PUBLIC_MENTORS_MAX_PAGE_SIZE))
    .default(PUBLIC_MENTORS_DEFAULT_PAGE_SIZE),
  tag: z.enum(MENTOR_TAGS, "Pick one of the listed tags").optional(),
});

export type PublicMentorQuery = z.infer<typeof publicMentorQuerySchema>;
