import { MENTOR_TAGS, apiHandler, createRequestScope, parseJsonBody, requireRole, requireSession } from "@devmentor/core";
import { mentorProfileSchema } from "@devmentor/core/validators/mentors/mentor-profile.schema";

// Mentors only, and always the caller's own profile: the id comes from the session, never from the request.
export const GET = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const profile = await cradle.mentorService.getOrCreateOwn(session.id);
  // The form's tag choices come from the server, so the UI never restates the list.
  return { ...profile, tagOptions: [...MENTOR_TAGS] };
});

export const PUT = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  const session = await requireSession(req, cradle.authService);
  requireRole(session, "mentor");
  const input = await parseJsonBody(req, mentorProfileSchema);
  return cradle.mentorService.updateOwn(session.id, input);
});
