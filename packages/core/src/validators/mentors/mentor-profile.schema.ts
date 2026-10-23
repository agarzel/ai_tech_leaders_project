import { z } from "zod";
import { MENTOR_TAGS } from "@devmentor/db/constants";

export const HEADLINE_MAX_LENGTH = 120;
export const BIO_MAX_LENGTH = 2000;
export const LINKS_MAX_COUNT = 5;
// Sanity bounds in grosze (10-10,000 PLN), not a business rule (spec: API Contracts, /api/mentor/profile).
export const PRICE_MIN_GROSZE = 1_000;
export const PRICE_MAX_GROSZE = 1_000_000;

const price = z
  .number("Enter a price")
  .int("Enter a whole number of grosze")
  .min(PRICE_MIN_GROSZE, "The price must be at least 10 PLN")
  .max(PRICE_MAX_GROSZE, "The price must be at most 10,000 PLN")
  .nullable();

const httpsLink = z
  .url({ protocol: /^https$/, message: "Enter a link starting with https://" })
  .max(2000, "The link is too long");

// PUT /api/mentor/profile and the /mentor/profile form. The profile is always the caller's own: no id here.
// A save requires a name and a headline; bio, tags, links and prices are optional (prices stay null until set).
export const mentorProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  headline: z.string().trim().min(1, "Headline is required").max(HEADLINE_MAX_LENGTH, `Headline must be at most ${HEADLINE_MAX_LENGTH} characters`),
  bio: z.string().trim().max(BIO_MAX_LENGTH, `Bio must be at most ${BIO_MAX_LENGTH} characters`).default(""),
  tags: z
    .array(z.enum(MENTOR_TAGS, "Pick one of the listed tags"))
    .default([])
    .refine((tags) => new Set(tags).size === tags.length, "Each tag can be picked once"),
  links: z.array(httpsLink).max(LINKS_MAX_COUNT, `Add at most ${LINKS_MAX_COUNT} links`).default([]),
  price25: price.default(null),
  price50: price.default(null),
});

export type MentorProfileInput = z.infer<typeof mentorProfileSchema>;
