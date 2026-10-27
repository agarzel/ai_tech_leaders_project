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

// POST /api/bookings/[id]/note/approve. The mentee approves or rejects the draft.
export const sessionNoteDecisionSchema = z.object({
  decision: z.enum(["approve", "reject"], "Choose approve or reject"),
});

export type SessionNoteWriteInput = z.infer<typeof sessionNoteWriteSchema>;
export type SessionNoteDecisionInput = z.infer<typeof sessionNoteDecisionSchema>;
