import { describe, expect, it } from "vitest";
import { bookingCreateSchema, QUESTION_MAX_LENGTH } from "./booking-create.schema";

const valid = { slotId: "s1", lengthMinutes: 25, question: "How do I structure a monorepo?", entryPoint: "list" };

describe("bookingCreateSchema", () => {
  it.each([25, 50])("accepts a %i-minute session", (lengthMinutes) => {
    expect(bookingCreateSchema.parse({ ...valid, lengthMinutes }).lengthMinutes).toBe(lengthMinutes);
  });

  it("trims the question", () => {
    expect(bookingCreateSchema.parse({ ...valid, question: "  hello  " }).question).toBe("hello");
  });

  it("accepts a question of exactly the maximum length", () => {
    expect(bookingCreateSchema.safeParse({ ...valid, question: "a".repeat(QUESTION_MAX_LENGTH) }).success).toBe(true);
  });

  it.each([
    ["a question over the limit", { question: "a".repeat(QUESTION_MAX_LENGTH + 1) }],
    ["a blank question", { question: "   " }],
    ["a missing question", { question: undefined }],
    ["a length that is not offered", { lengthMinutes: 30 }],
    ["a string length", { lengthMinutes: "25" }],
    ["an unknown entry point", { entryPoint: "banner" }],
    ["a missing entry point", { entryPoint: undefined }],
    ["an empty slot id", { slotId: "" }],
    ["a missing slot id", { slotId: undefined }],
  ])("rejects %s", (_name, override) => {
    expect(bookingCreateSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
