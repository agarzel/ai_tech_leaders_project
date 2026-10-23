import { z } from "zod";
import { registerSchema } from "./register.schema";

// Shared by POST /api/auth/register/mentor and the /register/mentor form. The e-mail is not part of it:
// it comes from the invitation. The token is added by the page (it lives in the link), not typed by the user.
export const registerMentorFormSchema = registerSchema.pick({ name: true, password: true });

export const registerMentorSchema = registerMentorFormSchema.extend({
  token: z.string().min(1, "Invitation token is required").max(512),
});

export type RegisterMentorInput = z.infer<typeof registerMentorSchema>;

// The preview takes the token in the body, not the URL: request paths end up in logs (see apiHandler).
export const invitationPreviewSchema = z.object({
  token: z.string().min(1, "Invitation token is required").max(512),
});
