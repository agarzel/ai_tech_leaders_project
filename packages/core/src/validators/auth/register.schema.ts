import { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "./password.constants";

// Shared by POST /api/auth/register (server validation) and the /register form (client validation).
// The role is deliberately not part of it: self-registration is always a mentee.
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.email("Enter a valid email address").max(255),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`)
    .meta({ input: "password" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
