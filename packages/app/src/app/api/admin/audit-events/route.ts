import { apiHandler, createRequestScope, parseOrThrow, requireAdmin } from "@devmentor/core";
import { auditEventListQuerySchema } from "@devmentor/core/validators/audit/audit-event-list.schema";

// Admin only (issue 119, threat model T-09): the audit log, newest first. Read-only – no other method is exported,
// so POST, PUT and DELETE answer 405 and entries cannot be changed over HTTP.
export const GET = apiHandler(async ({ req }) => {
  const { cradle } = await createRequestScope();
  const admin = await requireAdmin(req, cradle.authService);
  const query = parseOrThrow(auditEventListQuerySchema, Object.fromEntries(new URL(req.url).searchParams));
  return cradle.auditService.list(admin, query);
});
