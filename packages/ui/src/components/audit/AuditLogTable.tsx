"use client";

import type { ApiError } from "../../backend/api/types";
import { DataTable, type DataTableColumn, type DataTablePagination } from "../../backend/tables/DataTable";
import { formatDateTime } from "../../lib/format";
import { describeAction, describeDetails, describeUser, type AuditEventView } from "./describe-audit-event";

// Consumers import components by path (`components/<concept>/<Name>` → .tsx), so the labels and types travel with the table.
export { AUDIT_ACTION_LABELS, type AuditActionName, type AuditEventView, type AuditUser } from "./describe-audit-event";

type AuditLogTableProps = {
  events: AuditEventView[] | undefined;
  /** The viewer's IANA zone, e.g. from `browserTimeZone()`. */
  timeZone: string;
  isLoading?: boolean;
  error?: string | ApiError | null;
  onRetry?: () => void;
  pagination?: DataTablePagination;
};

/** The admin audit log (issue 119): newest first, every value in plain words – never a raw action key, id or ISO string. */
export function AuditLogTable({ events, timeZone, isLoading, error, onRetry, pagination }: AuditLogTableProps) {
  const columns: DataTableColumn<AuditEventView>[] = [
    { key: "occurredAt", header: "When", cell: (event) => formatDateTime(event.occurredAt, timeZone), className: "whitespace-nowrap" },
    { key: "action", header: "Action", cell: (event) => describeAction(event.action) },
    { key: "actor", header: "Actor", cell: (event) => describeUser(event.actor, event.actorKind) },
    { key: "target", header: "Target", cell: (event) => describeUser(event.target) },
    { key: "details", header: "Details", cell: (event) => describeDetails(event) },
  ];

  return (
    <DataTable
      columns={columns}
      rows={events}
      getRowId={(event) => event.id}
      isLoading={isLoading}
      error={error}
      onRetry={onRetry}
      emptyTitle="No audit entries yet"
      emptyDescription="Role changes, deleted users, invitations, CLI password changes and failed logins appear here."
      pagination={pagination}
    />
  );
}
