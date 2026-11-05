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
  it.each(["approve", "reject"])("accepts %s with the text the mentee saw", (decision) => {
    expect(sessionNoteDecisionSchema.parse({ decision, body: "Keep going." })).toEqual({ decision, body: "Keep going." });
  });

  it("rejects any other decision", () => {
    expect(sessionNoteDecisionSchema.safeParse({ decision: "publish", body: "x" }).success).toBe(false);
  });

  it("requires the text the mentee decided on (#136)", () => {
    expect(sessionNoteDecisionSchema.safeParse({ decision: "approve" }).success).toBe(false);
  });

  it("rejects a decided text over the note limit", () => {
    expect(sessionNoteDecisionSchema.safeParse({ decision: "approve", body: "x".repeat(NOTE_MAX_LENGTH + 1) }).success).toBe(false);
  });
});
