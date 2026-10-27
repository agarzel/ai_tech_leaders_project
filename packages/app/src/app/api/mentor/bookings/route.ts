import { apiHandler, createRequestScope, parseOrThrow, requireRole, requireSession } from "@devmentor/core";
import { bookingListQuerySchema } from "@devmentor/core/validators/bookings/booking-query.schema";

// Mentors only, and always their own bookings: the profile is resolved from the session.
export const GET = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const { page, pageSize } = parseOrThrow(bookingListQuerySchema, Object.fromEntries(new URL(req.url).searchParams));
  return cradle.bookingQueryService.listForMentor(session.id, { page, pageSize });
});
