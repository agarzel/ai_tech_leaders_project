import { Booking } from "@devmentor/db";
import { describe, expect, it, vi } from "vitest";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import { NOTE_MAX_LENGTH } from "../../validators/sessions/session-note.schema";
import { SessionNoteService } from "./session-note.service";

const HOUR = 3_600_000;
const STARTS_AT = new Date("2026-06-10T10:00:00Z");
const ENDS_AT = new Date(STARTS_AT.getTime() + 25 * 60_000);
const DEADLINE = new Date(ENDS_AT.getTime() + 7 * 24 * HOUR);

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: "b1",
    status: "confirmed",
    lengthMinutes: 25,
    slot: { startsAt: STARTS_AT },
    mentee: { id: "mentee" },
    mentor: { user: { id: "mentor" } },
    ...overrides,
  };
}

function setup(options: { booking?: ReturnType<typeof booking> | null; note?: Record<string, unknown> | null; now?: Date } = {}) {
  const note = options.note === undefined ? null : options.note;
  const em = {
    findOne: vi.fn(async (entity: unknown) => {
      return entity === Booking ? (options.booking === undefined ? booking() : options.booking) : note;
    }),
    create: vi.fn((_entity: unknown, data: Record<string, unknown>) => data),
    flush: vi.fn(async () => undefined),
  };
  const clock = { now: () => options.now ?? ENDS_AT };
  return { em, note, service: new SessionNoteService({ em: em as never, clock }) };
}

describe("SessionNoteService.write", () => {
  it("creates a draft once the session has ended", async () => {
    const { em, service } = setup();

    const dto = await service.write("b1", "mentor", " Good questions to ask next time. ");

    expect(em.create).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: "draft", body: "Good questions to ask next time." }));
    expect(dto).toEqual({ status: "draft", body: "Good questions to ask next time." });
  });

  it("replaces the body of an existing draft", async () => {
    const existing = { status: "draft", body: "old" };
    const { em, service } = setup({ note: existing });

    await service.write("b1", "mentor", "new");

    expect(existing.body).toBe("new");
    expect(em.create).not.toHaveBeenCalled();
    expect(em.flush).toHaveBeenCalled();
  });

  it("replaces a rejected note once and resets it for the mentee to decide again", async () => {
    const replacementTime = new Date(DEADLINE.getTime() + 1);
    const existing = { status: "rejected", body: "old", rejectedReplacementCount: 0, decidedAt: new Date(), replacedAt: null };
    const { em, service } = setup({ note: existing, now: replacementTime });

    await expect(service.write("b1", "mentor", " corrected ")).resolves.toEqual({ status: "draft", body: "corrected" });

    expect(existing).toMatchObject({
      status: "draft",
      body: "corrected",
      rejectedReplacementCount: 1,
      decidedAt: null,
      replacedAt: replacementTime,
    });
    expect(em.flush).toHaveBeenCalled();
  });

  it("refuses a second replacement after the replacement is rejected", async () => {
    const { service } = setup({ note: { status: "rejected", body: "again", rejectedReplacementCount: 1 } });

    await expect(service.write("b1", "mentor", "third attempt")).rejects.toThrow(ConflictError);
  });

  it("answers not_found for a user who is not the mentor", async () => {
    const { service } = setup();

    await expect(service.write("b1", "mentee", "hi")).rejects.toThrow(NotFoundError);
  });

  it("answers not_found when the booking does not exist", async () => {
    const { service } = setup({ booking: null });

    await expect(service.write("b1", "mentor", "hi")).rejects.toThrow(NotFoundError);
  });

  it("refuses a booking that is not confirmed", async () => {
    const { service } = setup({ booking: booking({ status: "declined" }) });

    await expect(service.write("b1", "mentor", "hi")).rejects.toThrow(ConflictError);
  });

  it("refuses a note before the session ends", async () => {
    const { service } = setup({ now: new Date(ENDS_AT.getTime() - 1) });

    await expect(service.write("b1", "mentor", "hi")).rejects.toThrow(ConflictError);
  });

  it("refuses to replace a note the mentee already decided", async () => {
    const { service } = setup({ note: { status: "approved", body: "done" } });

    await expect(service.write("b1", "mentor", "again")).rejects.toThrow(ConflictError);
  });

  it.each(["", "  "])("refuses an empty note %j", async (body) => {
    const { service } = setup();

    await expect(service.write("b1", "mentor", body)).rejects.toThrow(ValidationError);
  });

  it("refuses a note longer than the limit", async () => {
    const { service } = setup();

    await expect(service.write("b1", "mentor", "x".repeat(NOTE_MAX_LENGTH + 1))).rejects.toThrow(ValidationError);
  });
});

describe("SessionNoteService.decide", () => {
  it("approves a draft and records the decision time", async () => {
    const note = { status: "draft", body: "Keep the reading list short." };
    const { service } = setup({ note, now: ENDS_AT });

    const dto = await service.decide("b1", "mentee", "approve");

    expect(note).toMatchObject({ status: "approved", decidedAt: ENDS_AT });
    expect(dto).toEqual({ status: "approved", body: "Keep the reading list short." });
  });

  it("rejects a draft", async () => {
    const note = { status: "draft", body: "x" };
    const { service } = setup({ note });

    await expect(service.decide("b1", "mentee", "reject")).resolves.toMatchObject({ status: "rejected" });
  });

  it("answers not_found for a user who is not the mentee", async () => {
    const { service } = setup({ note: { status: "draft", body: "x" } });

    await expect(service.decide("b1", "mentor", "approve")).rejects.toThrow(NotFoundError);
  });

  it("answers not_found when there is no note", async () => {
    const { service } = setup({ note: null });

    await expect(service.decide("b1", "mentee", "approve")).rejects.toThrow(NotFoundError);
  });

  it("refuses a draft whose approval window has closed", async () => {
    const { service } = setup({ note: { status: "draft", body: "x" }, now: DEADLINE });

    await expect(service.decide("b1", "mentee", "approve")).rejects.toThrow(ConflictError);
  });

  it("refuses a note that is already decided", async () => {
    const { service } = setup({ note: { status: "approved", body: "x" } });

    await expect(service.decide("b1", "mentee", "reject")).rejects.toThrow(ConflictError);
  });
});

describe("SessionNoteService.readForMentee", () => {
  it("returns an approved note", async () => {
    const { service } = setup({ note: { status: "approved", body: "Ship the smaller change first." } });

    await expect(service.readForMentee("b1", "mentee")).resolves.toEqual({
      status: "approved",
      body: "Ship the smaller change first.",
    });
  });

  it("returns a draft for the mentee to decide on", async () => {
    const { service } = setup({ note: { status: "draft", body: "to decide" } });

    await expect(service.readForMentee("b1", "mentee")).resolves.toEqual({ status: "draft", body: "to decide" });
  });

  it("returns nothing for a rejected note", async () => {
    const { service } = setup({ note: { status: "rejected", body: "no" } });

    await expect(service.readForMentee("b1", "mentee")).resolves.toBeNull();
  });

  it("returns nothing for a draft that expired unanswered", async () => {
    const { service } = setup({ note: { status: "draft", body: "late" }, now: DEADLINE });

    await expect(service.readForMentee("b1", "mentee")).resolves.toBeNull();
  });

  it("returns nothing when no note was written", async () => {
    const { service } = setup({ note: null });

    await expect(service.readForMentee("b1", "mentee")).resolves.toBeNull();
  });

  it("answers not_found for a user who is not the mentee", async () => {
    const { service } = setup({ note: { status: "approved", body: "x" } });

    await expect(service.readForMentee("b1", "mentor")).rejects.toThrow(NotFoundError);
  });
});

describe("SessionNoteService.readForMentor", () => {
  it("returns the mentor's note in any state, rejected included", async () => {
    const { service } = setup({ note: { status: "rejected", body: "not published" } });

    await expect(service.readForMentor("b1", "mentor")).resolves.toEqual({ status: "rejected", body: "not published" });
  });

  it("returns nothing when no note was written", async () => {
    const { service } = setup({ note: null });

    await expect(service.readForMentor("b1", "mentor")).resolves.toBeNull();
  });

  it("answers not_found for a user who is not the mentor", async () => {
    const { service } = setup({ note: { status: "draft", body: "x" } });

    await expect(service.readForMentor("b1", "mentee")).rejects.toThrow(NotFoundError);
  });
});
