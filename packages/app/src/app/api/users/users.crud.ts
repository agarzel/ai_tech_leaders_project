import { makeCrudRoute } from "@devmentor/core";
import { userCreateSchema } from "@devmentor/core/validators/auth/user-create.schema";
import { userUpdateSchema } from "@devmentor/core/validators/auth/user-update.schema";

// Shared by api/users/route.ts (list, create) and api/users/[id]/route.ts (get, update, delete).
export const usersCrud = makeCrudRoute({
  service: (cradle) => cradle.userService,
  createSchema: userCreateSchema,
  updateSchema: userUpdateSchema,
  access: "admin",
});
