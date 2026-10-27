import { z } from "zod";

export const MESSAGE_MAX_LENGTH = 2000;

// POST /api/bookings/[id]/messages. Text only, one message per request.
export const sessionMessageSchema = z.object({
  body: z
    .string("The message must be text")
    .trim()
    .min(1, "Write a message")
    .max(MESSAGE_MAX_LENGTH, `The message must be at most ${MESSAGE_MAX_LENGTH} characters`),
});

export type SessionMessageInput = z.infer<typeof sessionMessageSchema>;
