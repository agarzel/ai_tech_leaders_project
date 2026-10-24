import { describe, expect, it } from "vitest";
import { mentorProfileSchema, PRICE_MAX_GROSZE, PRICE_MIN_GROSZE } from "./mentor-profile.schema";

const valid = { name: "Ada Lovelace", headline: "Staff engineer", bio: "Hello", tags: ["React"], links: ["https://github.com/ada"], price25: 8000, price50: 15000, listed: true };

describe("mentorProfileSchema", () => {
  it("accepts a full profile", () => {
    expect(mentorProfileSchema.parse(valid)).toEqual(valid);
  });

  it("fills optional fields: empty bio, tags and links, prices not set", () => {
    expect(mentorProfileSchema.parse({ name: "Ada", headline: "Engineer" })).toEqual({
      name: "Ada",
      headline: "Engineer",
      bio: "",
      tags: [],
      links: [],
      price25: null,
      price50: null,
      listed: false,
    });
  });

  it("requires a name and a headline", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, name: " " }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, headline: "  " }).success).toBe(false);
  });

  it("accepts a headline of 120 characters and rejects 121", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, headline: "a".repeat(120) }).success).toBe(true);
    expect(mentorProfileSchema.safeParse({ ...valid, headline: "a".repeat(121) }).success).toBe(false);
  });

  it("accepts a bio of 2,000 characters and rejects 2,001", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, bio: "a".repeat(2000) }).success).toBe(true);
    expect(mentorProfileSchema.safeParse({ ...valid, bio: "a".repeat(2001) }).success).toBe(false);
  });

  it("rejects a tag outside MENTOR_TAGS and a repeated tag", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, tags: ["Cobol"] }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, tags: ["React", "React"] }).success).toBe(false);
  });

  it("rejects a link that is not https", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, links: ["http://github.com/ada"] }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, links: ["javascript:alert(1)"] }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, links: ["not a url"] }).success).toBe(false);
  });

  it("accepts 5 links and rejects 6", () => {
    const link = (n: number) => `https://example.com/${n}`;
    expect(mentorProfileSchema.safeParse({ ...valid, links: [1, 2, 3, 4, 5].map(link) }).success).toBe(true);
    expect(mentorProfileSchema.safeParse({ ...valid, links: [1, 2, 3, 4, 5, 6].map(link) }).success).toBe(false);
  });

  it("rejects a link longer than 2,000 characters", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, links: [`https://example.com/${"a".repeat(2000)}`] }).success).toBe(false);
  });

  it("accepts prices at the bounds and rejects values outside them", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, price25: PRICE_MIN_GROSZE, price50: PRICE_MAX_GROSZE }).success).toBe(true);
    expect(mentorProfileSchema.safeParse({ ...valid, price25: PRICE_MIN_GROSZE - 1 }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, price50: PRICE_MAX_GROSZE + 1 }).success).toBe(false);
  });

  it("rejects fractional and non-numeric prices, accepts null", () => {
    expect(mentorProfileSchema.safeParse({ ...valid, price25: 1500.5 }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, price25: "80" }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, price25: null, price50: null }).success).toBe(true);
  });

  it("takes listed as a boolean, unlisted by default", () => {
    expect(mentorProfileSchema.parse({ ...valid, listed: false }).listed).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, listed: "yes" }).success).toBe(false);
    expect(mentorProfileSchema.safeParse({ ...valid, listed: null }).success).toBe(false);
  });
});
