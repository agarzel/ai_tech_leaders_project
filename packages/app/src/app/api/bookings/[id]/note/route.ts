import { apiHandler, createRequestScope, requireSession } from "@devmentor/core";

// The booking's mentee reads the mentor's note: the approved note only, otherwise null. Regardless of the
// caller's account role, since a mentor may book another mentor.
export const GET = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  return cradle.sessionNoteService.readForMentee(String(params.id), session.id);
});
