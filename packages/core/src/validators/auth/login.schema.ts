import { z } from "zod";
import { PASSWORD_MAX_LENGTH } from "./password.constants";

// Shared by POST /api/auth/login and the /login form. The password policy is not checked here:
// a wrong password must look the same whatever its length.
export const loginSchema = z.object({
  email: z.email("Enter a valid email address").max(255),
  password: z
    .string()
    .min(1, "Password is required")
    .max(PASSWORD_MAX_LENGTH, "Invalid email or password")
    .meta({ input: "password" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
