import { apiHandler, createRequestScope, parseOrThrow } from "@devmentor/core";
import { publicMentorQuerySchema } from "@devmentor/core/validators/mentors/public-mentor-query.schema";

// Public: no session. The DTO carries no email and no user id; an invalid query is a 400, never silently ignored.
export const GET = apiHandler(async ({ req }) => {
  const query = parseOrThrow(publicMentorQuerySchema, Object.fromEntries(new URL(req.url).searchParams));
  const { cradle } = await createRequestScope();
  return cradle.mentorService.listPublic(query);
});
