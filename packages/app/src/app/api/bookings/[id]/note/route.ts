import { apiHandler, createRequestScope, requireRole, requireSession } from "@devmentor/core";

// The mentee's view of the mentor's note: the approved note only, otherwise null.
export const GET = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentee");
  return cradle.sessionNoteService.readForMentee(String(params.id), session.id);
});
