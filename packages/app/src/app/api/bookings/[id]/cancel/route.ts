import { apiHandler, createRequestScope, requireSession } from "@devmentor/core";

// The booking's mentee cancels one of their confirmed bookings before the session starts — regardless of the
// caller's account role, since a mentor may book another mentor. The answer says whether the payment is
// refunded (`refunded`) or kept by the mentor (`not_refunded`), with the booking as it now reads.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  const id = String(params.id);
  const outcome = await cradle.bookingTransitions.cancelByMentee(session.id, id);
  return { outcome, booking: await cradle.bookingQueryService.getForMentee(session.id, id) };
});
