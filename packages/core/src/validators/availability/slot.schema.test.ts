import { describe, expect, it } from "vitest";
import { slotCreateSchema, slotIdSchema } from "./slot.schema";

describe("slotCreateSchema", () => {
  it("parses an ISO UTC datetime into a Date", () => {
    const result = slotCreateSchema.parse({ startsAt: "2026-06-03T10:15:00Z" });

    expect(result.startsAt).toEqual(new Date("2026-06-03T10:15:00Z"));
  });

  it.each(["tomorrow", "2026-06-03", "2026-06-03T10:15:00+02:00", ""])("rejects %j", (startsAt) => {
    expect(slotCreateSchema.safeParse({ startsAt }).success).toBe(false);
  });

  it("rejects a missing start", () => {
    expect(slotCreateSchema.safeParse({}).success).toBe(false);
  });
});

describe("slotIdSchema", () => {
  it("accepts a non-empty string", () => {
    expect(slotIdSchema.parse("abc")).toBe("abc");
  });

  it.each(["", 5, undefined])("rejects %j", (value) => {
    expect(slotIdSchema.safeParse(value).success).toBe(false);
  });
});
