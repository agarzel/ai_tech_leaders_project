import { z } from "zod";
import { USER_ROLES } from "@devmentor/db/constants";

// Shared by the API route (server validation) and the admin form (client validation).
export const userCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.email("Enter a valid email address").max(255),
  role: z.enum(USER_ROLES),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
