import { apiHandler, createRequestScope } from "@devmentor/core";

// Public: the share link is the access. An unknown slug is a 404; a mentor who is not on the list is reachable by the link.
export const GET = apiHandler(async ({ params }) => {
  const { cradle } = await createRequestScope();
  return cradle.mentorService.getPublicBySlug(String(params.slug));
});
