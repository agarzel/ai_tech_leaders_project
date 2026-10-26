import { apiHandler, createRequestScope, parseJsonBody, requireRole, requireSession } from "@devmentor/core";
import { bookingDeclineSchema } from "@devmentor/core/validators/bookings/booking-decline.schema";

// The mentor declines one of their own bookings (optional reason); the mentee is refunded in full.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const { reason } = await parseJsonBody(req, bookingDeclineSchema);
  const id = String(params.id);
  await cradle.bookingTransitions.decline(session.id, id, reason);
  return cradle.bookingQueryService.getForMentor(session.id, id);
});
