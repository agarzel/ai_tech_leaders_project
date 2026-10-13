import type { z } from "zod";
import { userCreateSchema } from "./user-create.schema";

// PUT replaces all editable fields, so the update shape equals the create shape.
export const userUpdateSchema = userCreateSchema;

export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
