import { z } from "zod";

// POST /api/admin/invitations and the /admin/invitations form. The address is normalized by the service.
export const invitationCreateSchema = z.object({
  email: z.email("Enter a valid email address").max(255),
});

export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
