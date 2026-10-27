import { describe, expect, it } from "vitest";
import { NOTE_MAX_LENGTH, sessionNoteDecisionSchema, sessionNoteWriteSchema } from "./session-note.schema";

describe("sessionNoteWriteSchema", () => {
  it("trims the note", () => {
    expect(sessionNoteWriteSchema.parse({ body: " Keep going. " })).toEqual({ body: "Keep going." });
  });

  it("rejects an empty note", () => {
    expect(sessionNoteWriteSchema.safeParse({ body: "" }).success).toBe(false);
  });

  it("rejects a note over the limit", () => {
    expect(sessionNoteWriteSchema.safeParse({ body: "x".repeat(NOTE_MAX_LENGTH + 1) }).success).toBe(false);
  });
});

describe("sessionNoteDecisionSchema", () => {
  it.each(["approve", "reject"])("accepts %s", (decision) => {
    expect(sessionNoteDecisionSchema.parse({ decision })).toEqual({ decision });
  });

  it("rejects any other decision", () => {
    expect(sessionNoteDecisionSchema.safeParse({ decision: "publish" }).success).toBe(false);
  });
});
