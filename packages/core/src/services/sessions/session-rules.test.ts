import { describe, expect, it } from "vitest";
import { ConflictError } from "../../http/errors";
import {
  assertMessagingOpen,
  assertNoteDecidable,
  assertNoteWritable,
  canReadThread,
  cancellationOutcome,
  freeCancellationUntil,
  isMessagingOpen,
  noteEffectiveStatus,
  sessionEndsAt,
} from "./session-rules";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const STARTS_AT = new Date("2026-06-10T10:00:00Z");
const ENDS_AT = new Date(STARTS_AT.getTime() + 25 * MINUTE);
const at = (ms: number) => new Date(STARTS_AT.getTime() + ms);

describe("sessionEndsAt", () => {
  it("adds the session length to the start", () => {
    expect(sessionEndsAt(STARTS_AT, 50).toISOString()).toBe("2026-06-10T10:50:00.000Z");
  });
});

describe("messaging window", () => {
  it("is open exactly from the start up to the end", () => {
    expect(isMessagingOpen(STARTS_AT, 25, STARTS_AT)).toBe(true);
    expect(isMessagingOpen(STARTS_AT, 25, at(25 * MINUTE - 1))).toBe(true);
    expect(isMessagingOpen(STARTS_AT, 25, ENDS_AT)).toBe(false);
  });

  it("is closed before the start", () => {
    expect(isMessagingOpen(STARTS_AT, 25, at(-1))).toBe(false);
  });

  it("refuses a message outside the window with a conflict", () => {
    expect(() => assertMessagingOpen(STARTS_AT, 25, at(-1))).toThrow(ConflictError);
  });

  it("accepts a message inside the window", () => {
    expect(() => assertMessagingOpen(STARTS_AT, 25, at(MINUTE))).not.toThrow();
  });

  it("keeps the thread readable until a day after the end", () => {
    expect(canReadThread(STARTS_AT, 25, at(MINUTE))).toBe(true);
    expect(canReadThread(STARTS_AT, 25, new Date(ENDS_AT.getTime() + DAY - 1))).toBe(true);
    expect(canReadThread(STARTS_AT, 25, new Date(ENDS_AT.getTime() + DAY))).toBe(false);
  });
});

describe("note status", () => {
  const deadline = new Date(ENDS_AT.getTime() + 7 * DAY);

  it("keeps a draft as a draft before its approval window closes", () => {
    expect(noteEffectiveStatus("draft", STARTS_AT, 25, new Date(deadline.getTime() - 1))).toBe("draft");
  });

  it("reads a draft as rejected once its approval window has closed", () => {
    expect(noteEffectiveStatus("draft", STARTS_AT, 25, deadline)).toBe("rejected");
  });

  it("never changes an approved or rejected note", () => {
    expect(noteEffectiveStatus("approved", STARTS_AT, 25, deadline)).toBe("approved");
    expect(noteEffectiveStatus("rejected", STARTS_AT, 25, deadline)).toBe("rejected");
  });

  it("lets the mentor write only a draft after the session has ended", () => {
    expect(() => assertNoteWritable("draft", STARTS_AT, 25, ENDS_AT)).not.toThrow();
  });

  it("refuses a note before the session ends", () => {
    expect(() => assertNoteWritable("draft", STARTS_AT, 25, new Date(ENDS_AT.getTime() - 1))).toThrow(ConflictError);
  });

  it("refuses to replace a decided note", () => {
    expect(() => assertNoteWritable("approved", STARTS_AT, 25, ENDS_AT)).toThrow(ConflictError);
    expect(() => assertNoteWritable("rejected", STARTS_AT, 25, ENDS_AT)).toThrow(ConflictError);
  });

  it("refuses to write a draft whose approval window has closed", () => {
    expect(() => assertNoteWritable("draft", STARTS_AT, 25, deadline)).toThrow(ConflictError);
  });

  it("lets the mentee decide only a draft inside its window", () => {
    expect(() => assertNoteDecidable("draft", STARTS_AT, 25, ENDS_AT)).not.toThrow();
    expect(() => assertNoteDecidable("draft", STARTS_AT, 25, deadline)).toThrow(ConflictError);
    expect(() => assertNoteDecidable("approved", STARTS_AT, 25, ENDS_AT)).toThrow(ConflictError);
  });
});

describe("cancellationOutcome", () => {
  it("refunds in full more than 12 hours before the start", () => {
    expect(cancellationOutcome(STARTS_AT, new Date(STARTS_AT.getTime() - 12 * HOUR - 1))).toBe("refunded");
  });

  it("keeps the payment for the mentor from 12 hours before the start", () => {
    expect(cancellationOutcome(STARTS_AT, new Date(STARTS_AT.getTime() - 12 * HOUR))).toBe("not_refunded");
    expect(cancellationOutcome(STARTS_AT, new Date(STARTS_AT.getTime() - 1))).toBe("not_refunded");
  });

  it("refuses a cancellation once the session has started", () => {
    expect(() => cancellationOutcome(STARTS_AT, STARTS_AT)).toThrow(ConflictError);
  });
});

describe("freeCancellationUntil", () => {
  it("is 12 hours before the start", () => {
    expect(freeCancellationUntil(STARTS_AT).toISOString()).toBe("2026-06-09T22:00:00.000Z");
  });
});
