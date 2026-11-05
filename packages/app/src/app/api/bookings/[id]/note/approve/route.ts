import { apiHandler, createRequestScope, parseJsonBody, requireSession } from "@devmentor/core";
import { sessionNoteDecisionSchema } from "@devmentor/core/validators/sessions/session-note.schema";

// The booking's mentee approves or rejects the mentor's draft note; a draft past its window, or one the mentor
// replaced after the mentee read it (the sent `body` differs), answers 409.
// Regardless of the caller's account role, since a mentor may book another mentor.
export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  const { decision, body } = await parseJsonBody(req, sessionNoteDecisionSchema);
  return cradle.sessionNoteService.decide(String(params.id), session.id, decision, body);
});
