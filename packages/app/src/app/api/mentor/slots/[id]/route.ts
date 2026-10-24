import { apiHandler, createRequestScope, parseOrThrow, requireRole, requireSession } from "@devmentor/core";
import { slotIdSchema } from "@devmentor/core/validators/availability/slot.schema";

// Deletes an open slot of the caller; another mentor's slot answers 404 like a missing one.
export const DELETE = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const id = parseOrThrow(slotIdSchema, params.id);
  await cradle.slotService.deleteOwn(session.id, id);
  return { id };
});
