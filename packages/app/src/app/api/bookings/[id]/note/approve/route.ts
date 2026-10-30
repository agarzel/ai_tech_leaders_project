import { apiHandler, createRequestScope, parseJsonBody, requireSession } from "@devmentor/core";
import { sessionNoteDecisionSchema } from "@devmentor/core/validators/sessions/session-note.schema";

// The booking's mentee approves or rejects the mentor's draft note; a draft past its window answers 409.
// Regardless of the caller's account role, since a mentor may book another mentor.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  const { decision } = await parseJsonBody(req, sessionNoteDecisionSchema);
  return cradle.sessionNoteService.decide(String(params.id), session.id, decision);
});
