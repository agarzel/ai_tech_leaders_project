import { Booking, SessionNote, type EntityManager, type IBooking } from "@devmentor/db";
import type { Clock } from "../../clock";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import { assertNoteDecidable, assertNoteWritable, noteEffectiveStatus, type NoteStatus } from "./session-rules";

export const NOTE_MAX_LENGTH = 1000;

export type NoteDto = { status: NoteStatus; body: string };

/**
 * The mentor's optional note after a session. The mentor writes it, the mentee decides it,
 * and only an approved note is ever shown to the mentee (R02, R06).
 */
export class SessionNoteService {
  constructor(private readonly deps: { em: EntityManager; clock: Clock }) {}

  /** Creates the note or replaces a draft; a decided note is final. */
  async write(bookingId: string, mentorUserId: string, body: string): Promise<NoteDto> {
    const booking = await this.loadBooking(bookingId, mentorUserId, "mentor");
    if (booking.status !== "confirmed") {
      throw new ConflictError("A note is written for a confirmed booking");
    }
    const { em } = this.deps;
    const now = this.deps.clock.now();
    const existing = await em.findOne(SessionNote, { booking: bookingId });
    assertNoteWritable(existing?.status ?? "draft", booking.slot.startsAt, booking.lengthMinutes, now);

    const text = body.trim();
    if (text.length === 0 || text.length > NOTE_MAX_LENGTH) {
      throw new ValidationError("Invalid note", { body: [`Write 1 to ${NOTE_MAX_LENGTH} characters`] });
    }

    if (existing) {
      existing.body = text;
    } else {
      em.create(SessionNote, { booking, body: text, status: "draft" });
    }
    await em.flush();
    return { status: "draft", body: text };
  }

  /** The mentee approves or rejects the draft. Only the draft inside its approval window can be decided. */
  async decide(bookingId: string, menteeUserId: string, decision: "approve" | "reject"): Promise<NoteDto> {
    const booking = await this.loadBooking(bookingId, menteeUserId, "mentee");
    const note = await this.deps.em.findOne(SessionNote, { booking: bookingId });
    if (!note) {
      throw new NotFoundError("Note not found");
    }
    const now = this.deps.clock.now();
    assertNoteDecidable(note.status, booking.slot.startsAt, booking.lengthMinutes, now);

    note.status = decision === "approve" ? "approved" : "rejected";
    note.decidedAt = now;
    await this.deps.em.flush();
    return { status: note.status, body: note.body };
  }

  /** What the mentee sees: the approved note, or nothing. Drafts and rejected notes are never returned. */
  async readForMentee(bookingId: string, menteeUserId: string): Promise<NoteDto | null> {
    const booking = await this.loadBooking(bookingId, menteeUserId, "mentee");
    const note = await this.deps.em.findOne(SessionNote, { booking: bookingId });
    if (!note) {
      return null;
    }
    const status = noteEffectiveStatus(note.status, booking.slot.startsAt, booking.lengthMinutes, this.deps.clock.now());
    return status === "approved" ? { status, body: note.body } : null;
  }

  /** A booking that is not the caller's, in the caller's role, is `not_found`, so existence does not leak. */
  private async loadBooking(bookingId: string, userId: string, role: "mentor" | "mentee"): Promise<IBooking> {
    const booking = await this.deps.em.findOne(Booking, { id: bookingId }, { populate: ["slot", "mentee", "mentor.user"] });
    const isRole = role === "mentee" ? booking?.mentee.id === userId : booking?.mentor.user.id === userId;
    if (!booking || !isRole) {
      throw new NotFoundError("Booking not found");
    }
    return booking;
  }
}
