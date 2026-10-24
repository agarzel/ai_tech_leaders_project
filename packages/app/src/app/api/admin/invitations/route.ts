import { apiHandler, createRequestScope, parseJsonBody, requireAdmin } from "@devmentor/core";
import { invitationCreateSchema } from "@devmentor/core/validators/mentors/invitation-create.schema";

// Admin only: the list never contains tokens or hashes.
export const GET = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  await requireAdmin(req, cradle.authService);
  return cradle.invitationService.listForAdmin();
});

// Admin only (every admin is a founder). The link, which carries the raw token, appears in this response and nowhere else.
export const POST = apiHandler(
  async ({ req }) => {
    const { cradle } = await createRequestScope();
    const admin = await requireAdmin(req, cradle.authService);
    const { email } = await parseJsonBody(req, invitationCreateSchema);
    const { token, ...invitation } = await cradle.invitationService.create(admin.id, email);
    const link = `${new URL(req.url).origin}/register/mentor?token=${encodeURIComponent(token)}`;
    return { invitation, link };
  },
  { successStatus: 201 },
);
