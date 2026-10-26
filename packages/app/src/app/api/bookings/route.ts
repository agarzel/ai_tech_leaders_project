import { apiHandler, createRequestScope, parseJsonBody, parseOrThrow, requireSession } from "@devmentor/core";
import { bookingCreateSchema } from "@devmentor/core/validators/bookings/booking-create.schema";
import { bookingListQuerySchema } from "@devmentor/core/validators/bookings/booking-query.schema";

// Any signed-in user may book (a mentor may book other mentors). The mentee is always the caller, never a body field.
export const GET = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  const query = parseOrThrow(bookingListQuerySchema, Object.fromEntries(new URL(req.url).searchParams));
  return cradle.bookingQueryService.listForMentee(session.id, query);
});

export const POST = apiHandler(
  async ({ req }) => {
    const { cradle } = await createRequestScope();
    const session = await requireSession(req, cradle.authService);
    const input = await parseJsonBody(req, bookingCreateSchema);
    return cradle.bookingService.create(session.id, input);
  },
  { successStatus: 201 },
);
