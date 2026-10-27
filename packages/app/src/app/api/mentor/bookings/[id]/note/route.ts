import { apiHandler, createRequestScope, parseJsonBody, requireRole, requireSession } from "@devmentor/core";
import { sessionNoteWriteSchema } from "@devmentor/core/validators/sessions/session-note.schema";

// The mentor writes or replaces the draft note after the session; a decided note answers 409.
export const PUT = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const { body } = await parseJsonBody(req, sessionNoteWriteSchema);
  return cradle.sessionNoteService.write(String(params.id), session.id, body);
});
