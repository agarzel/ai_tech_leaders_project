"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuditEventDto, Page } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { AUDIT_ACTION_LABELS, AuditLogTable } from "@devmentor/ui/components/audit/AuditLogTable";
import { Label } from "@devmentor/ui/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@devmentor/ui/components/ui/native-select";
import { formatZoneLabel } from "@devmentor/ui/lib/format";
import { useTimeZone } from "../../../lib/use-time-zone";

const PAGE_SIZE = 20;

/** The audit log list with an action filter (issue 119). Read-only. */
export function AuditAdmin() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [data, setData] = useState<Page<AuditEventDto>>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // undefined while rendering on the server, so server and first client markup stay equal.
  const timeZone = useTimeZone();

  const load = useCallback(async () => {
    setIsLoading(true);
    const filter = action ? `&action=${encodeURIComponent(action)}` : "";
    const result = await apiCall<Page<AuditEventDto>>(`/api/admin/audit-events?page=${page}&pageSize=${PAGE_SIZE}${filter}`);
    setIsLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setData(result.data);
  }, [page, action]);

  useEffect(() => {
    // Fetching on mount and on page or filter change is the intended side effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="audit-action">Action</Label>
        <NativeSelect
          id="audit-action"
          name="action"
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
        >
          <NativeSelectOption value="">All actions</NativeSelectOption>
          {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      {timeZone && <p className="text-muted-foreground text-sm">Times in {formatZoneLabel(timeZone, new Date())}</p>}
      <div className="overflow-x-auto">
        <AuditLogTable
          events={data?.items}
          // Rows arrive after mount (client fetch), when the zone is known; UTC only covers the type.
          timeZone={timeZone ?? "UTC"}
          isLoading={isLoading}
          error={error}
          onRetry={() => void load()}
          pagination={data ? { page, pageSize: PAGE_SIZE, total: data.total, onPageChange: setPage } : undefined}
        />
      </div>
    </div>
  );
}
