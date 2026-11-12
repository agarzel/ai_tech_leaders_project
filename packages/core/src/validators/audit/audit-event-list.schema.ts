import { z } from "zod";
import { AUDIT_ACTIONS } from "@devmentor/db/constants";

// Client-safe re-export: the action list for forms, filters and the ui drift check, without server code.
export { AUDIT_ACTIONS };

export const AUDIT_PAGE_SIZE_MAX = 100;

// GET /api/admin/audit-events. Query strings are strings, so numbers are coerced; unknown keys are refused.
export const auditEventListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(AUDIT_PAGE_SIZE_MAX).default(20),
    action: z.enum(AUDIT_ACTIONS, "Unknown audit action").optional(),
    actorUserId: z.uuid("Invalid actor id").optional(),
  })
  .strict();

export type AuditEventListQuery = z.infer<typeof auditEventListQuerySchema>;
