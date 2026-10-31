import { ConflictError } from "../../http/errors";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The thread stays readable for a day after the session ends (spec: Data Model, API Contracts). */
export const THREAD_READ_GRACE_MS = DAY;
/** The mentee has this long to approve a draft note once the session has ended (spec: Open Question 4). */
export const NOTE_APPROVAL_WINDOW_MS = 7 * DAY;
/** Cancelling is free until this long before the session (R04). */
export const FREE_CANCELLATION_LEAD_MS = 12 * HOUR;

export type NoteStatus = "draft" | "approved" | "rejected";
export type CancellationOutcome = "refunded" | "not_refunded";

export function sessionEndsAt(startsAt: Date, lengthMinutes: number): Date {
  return new Date(startsAt.getTime() + lengthMinutes * 60_000);
}

/** Messages can be sent only while the session is running: from its start up to its end. */
export function isMessagingOpen(startsAt: Date, lengthMinutes: number, now: Date): boolean {
  return now.getTime() >= startsAt.getTime() && now.getTime() < sessionEndsAt(startsAt, lengthMinutes).getTime();
}

/** The thread can be read until a day after the session ends. */
export function canReadThread(startsAt: Date, lengthMinutes: number, now: Date): boolean {
  return now.getTime() < sessionEndsAt(startsAt, lengthMinutes).getTime() + THREAD_READ_GRACE_MS;
}

export function assertMessagingOpen(startsAt: Date, lengthMinutes: number, now: Date): void {
  if (!isMessagingOpen(startsAt, lengthMinutes, now)) {
    throw new ConflictError("The session window is closed");
  }
}

/** A draft note the mentee never answered is rejected automatically and never shown. */
export function noteEffectiveStatus(
  status: NoteStatus,
  startsAt: Date,
  lengthMinutes: number,
  now: Date,
  replacedAt: Date | null = null,
): NoteStatus {
  const deadline = (replacedAt?.getTime() ?? sessionEndsAt(startsAt, lengthMinutes).getTime()) + NOTE_APPROVAL_WINDOW_MS;
  return status === "draft" && now.getTime() >= deadline ? "rejected" : status;
}

/** The mentor writes or replaces the note only after the session has ended, and only while it is a draft. */
export function assertNoteWritable(
  status: NoteStatus,
  rejectedReplacementCount: number,
  replacedAt: Date | null,
  startsAt: Date,
  lengthMinutes: number,
  now: Date,
): void {
  if (now.getTime() < sessionEndsAt(startsAt, lengthMinutes).getTime()) {
    throw new ConflictError("The note can be written only after the session ends");
  }
  if (noteEffectiveStatus(status, startsAt, lengthMinutes, now, replacedAt) !== "draft" &&
      !(status === "rejected" && rejectedReplacementCount === 0)) {
    throw new ConflictError("The note is already decided");
  }
}

/** The mentee decides only a draft that is still inside its approval window. */
export function assertNoteDecidable(
  status: NoteStatus,
  startsAt: Date,
  lengthMinutes: number,
  now: Date,
  replacedAt: Date | null = null,
): void {
  if (noteEffectiveStatus(status, startsAt, lengthMinutes, now, replacedAt) !== "draft") {
    throw new ConflictError("The note is no longer waiting for approval");
  }
}

/** The last moment a cancellation is still refunded in full (R04): 12 h before the start. */
export function freeCancellationUntil(startsAt: Date): Date {
  return new Date(startsAt.getTime() - FREE_CANCELLATION_LEAD_MS);
}

/** Free until 12 h before the start (R04); later the mentor keeps the payment; from the start on it is refused. */
export function cancellationOutcome(startsAt: Date, now: Date): CancellationOutcome {
  if (now.getTime() >= startsAt.getTime()) {
    throw new ConflictError("A session that has started cannot be cancelled");
  }
  return now.getTime() < startsAt.getTime() - FREE_CANCELLATION_LEAD_MS ? "refunded" : "not_refunded";
}
