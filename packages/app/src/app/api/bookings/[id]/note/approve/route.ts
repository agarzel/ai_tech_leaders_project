import { apiHandler, createRequestScope, parseJsonBody, requireRole, requireSession } from "@devmentor/core";
import { sessionNoteDecisionSchema } from "@devmentor/core/validators/sessions/session-note.schema";

// The mentee approves or rejects the mentor's draft note; a draft past its window answers 409.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentee");
  const { decision } = await parseJsonBody(req, sessionNoteDecisionSchema);
  return cradle.sessionNoteService.decide(String(params.id), session.id, decision);
});
