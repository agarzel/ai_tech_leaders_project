import { apiHandler, createRequestScope, requireRole, requireSession } from "@devmentor/core";

// The mentee cancels one of their confirmed bookings before the session starts. The answer says whether the
// payment is refunded (`refunded`) or kept by the mentor (`not_refunded`), with the booking as it now reads.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentee");
  const id = String(params.id);
  const outcome = await cradle.bookingTransitions.cancelByMentee(session.id, id);
  return { outcome, booking: await cradle.bookingQueryService.getForMentee(session.id, id) };
});
