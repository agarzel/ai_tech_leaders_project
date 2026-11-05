import { z } from "zod";

export const NOTE_MAX_LENGTH = 1000;

// PUT /api/mentor/bookings/[id]/note. The mentor's optional note after the session.
export const sessionNoteWriteSchema = z.object({
  body: z
    .string("The note must be text")
    .trim()
    .min(1, "Write a note")
    .max(NOTE_MAX_LENGTH, `The note must be at most ${NOTE_MAX_LENGTH} characters`),
});

// POST /api/bookings/[id]/note/approve. The mentee approves or rejects the draft. `body` is the text the
// mentee was shown: a decision applies only to that text, so a draft the mentor replaced since is refused (#136).
export const sessionNoteDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"], "Choose approve or reject"),
  body: z.string("Send the note you decided on").max(NOTE_MAX_LENGTH, `The note must be at most ${NOTE_MAX_LENGTH} characters`),
});

export type SessionNoteWriteInput = z.infer<typeof sessionNoteWriteSchema>;
export type SessionNoteDecisionInput = z.infer<typeof sessionNoteDecisionSchema>;
