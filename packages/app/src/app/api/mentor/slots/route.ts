import { apiHandler, createRequestScope, parseJsonBody, requireRole, requireSession } from "@devmentor/core";
import { slotCreateSchema } from "@devmentor/core/validators/availability/slot.schema";

// Mentors only, and always their own slots: the profile is resolved from the session, never from the request.
export const GET = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  return cradle.slotService.listForOwner(session.id);
});

export const POST = apiHandler(
  async ({ req }) => {
    const { cradle } = await createRequestScope();
    const session = await requireSession(req, cradle.authService);
    requireRole(session, "mentor");
    const { startsAt } = await parseJsonBody(req, slotCreateSchema);
    return cradle.slotService.publish(session.id, startsAt);
  },
  { successStatus: 201 },
);
