import { apiHandler, createRequestScope, parseJsonBody, requireSession } from "@devmentor/core";
import { sessionMessageSchema } from "@devmentor/core/validators/sessions/session-message.schema";

// The booking's text thread; only its mentee and mentor can read or write it, anyone else answers 404.
export const GET = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  return cradle.sessionThreadService.list(String(params.id), session.id);
});

export const POST = apiHandler(async ({ req, params }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  const { body } = await parseJsonBody(req, sessionMessageSchema);
  return cradle.sessionThreadService.post(String(params.id), session.id, body);
});
