import { apiHandler, createRequestScope, requireSession } from "@devmentor/core";

// The caller's own booking as mentee; anyone else's answers 404 like a missing one.
export const GET = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  return cradle.bookingQueryService.getForMentee(session.id, String(params.id));
});
