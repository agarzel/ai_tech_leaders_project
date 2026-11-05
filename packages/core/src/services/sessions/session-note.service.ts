import { Booking, SessionNote, type EntityManager, type IBooking } from "@devmentor/db";
import type { Clock } from "../../clock";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import { NOTE_MAX_LENGTH } from "../../validators/sessions/session-note.schema";
import { assertNoteDecidable, assertNoteWritable, noteEffectiveStatus, type NoteStatus } from "./session-rules";

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
    assertNoteWritable(
      existing?.status ?? "draft",
      existing?.rejectedReplacementCount ?? 0,
      existing?.replacedAt ?? null,
      booking.slot.startsAt,
      booking.lengthMinutes,
      now,
    );

    const text = body.trim();
    if (text.length === 0 || text.length > NOTE_MAX_LENGTH) {
      throw new ValidationError("Invalid note", { body: [`Write 1 to ${NOTE_MAX_LENGTH} characters`] });
    }

    if (existing) {
      const fields =
        existing.status === "rejected"
          ? { body: text, status: "draft" as const, rejectedReplacementCount: existing.rejectedReplacementCount + 1, decidedAt: null, replacedAt: now }
          : { body: text };
      // Conditional on the state read above: the mentee may have decided the draft in the meantime, and an
      // approved note must keep the text that was approved (#136).
      const updated = await em.nativeUpdate(
        SessionNote,
        { id: existing.id, status: existing.status, rejectedReplacementCount: existing.rejectedReplacementCount },
        fields,
      );
      if (updated === 0) {
        throw new ConflictError("The mentee has just decided this note");
      }
    } else {
      em.create(SessionNote, { booking, body: text, status: "draft" });
      await em.flush();
    }
    return { status: "draft", body: text };
  }

  /**
   * The mentee approves or rejects the draft. Only the draft inside its approval window can be decided, and only
   * the text the mentee was shown (`seenBody`): if the mentor replaced the draft since, the decision is refused,
   * so nobody approves a note they never read (#136).
   */
  async decide(bookingId: string, menteeUserId: string, decision: "approve" | "reject", seenBody: string): Promise<NoteDto> {
    const booking = await this.loadBooking(bookingId, menteeUserId, "mentee");
    const note = await this.deps.em.findOne(SessionNote, { booking: bookingId });
    if (!note) {
      throw new NotFoundError("Note not found");
    }
    const now = this.deps.clock.now();
    assertNoteDecidable(note.status, booking.slot.startsAt, booking.lengthMinutes, now, note.replacedAt);
    const changed = new ConflictError("The mentor changed this note. Read the new version before you decide.");
    if (seenBody.trim() !== note.body) {
      throw changed;
    }

    const status = decision === "approve" ? "approved" : "rejected";
    // Conditional on the text the mentee saw: a replacement committed after the read above refuses the decision.
    const updated = await this.deps.em.nativeUpdate(SessionNote, { id: note.id, status: "draft", body: note.body }, { status, decidedAt: now });
    if (updated === 0) {
      throw changed;
    }
    return { status, body: note.body };
  }

  /**
   * What the mentee sees: the draft to decide on, or the approved note. A rejected note, or a draft that
   * expired unanswered, is never returned.
   */
  async readForMentee(bookingId: string, menteeUserId: string): Promise<NoteDto | null> {
    const booking = await this.loadBooking(bookingId, menteeUserId, "mentee");
    return this.readNote(bookingId, booking, true);
  }

  /** The mentor reads their own note in any state, including a rejected one. */
  async readForMentor(bookingId: string, mentorUserId: string): Promise<NoteDto | null> {
    const booking = await this.loadBooking(bookingId, mentorUserId, "mentor");
    return this.readNote(bookingId, booking, false);
  }

  private async readNote(bookingId: string, booking: IBooking, hideRejected: boolean): Promise<NoteDto | null> {
    const note = await this.deps.em.findOne(SessionNote, { booking: bookingId });
    if (!note) {
      return null;
    }
    const status = noteEffectiveStatus(
      note.status,
      booking.slot.startsAt,
      booking.lengthMinutes,
      this.deps.clock.now(),
      note.replacedAt,
    );
    return hideRejected && status === "rejected" ? null : { status, body: note.body };
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
