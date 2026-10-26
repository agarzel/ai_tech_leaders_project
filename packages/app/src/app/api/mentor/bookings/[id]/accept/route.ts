import { apiHandler, createRequestScope, requireRole, requireSession } from "@devmentor/core";

// The mentor takes one of their own bookings; another mentor's booking answers 404, a passed deadline 409.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const id = String(params.id);
  await cradle.bookingTransitions.accept(session.id, id);
  return cradle.bookingQueryService.getForMentor(session.id, id);
});
