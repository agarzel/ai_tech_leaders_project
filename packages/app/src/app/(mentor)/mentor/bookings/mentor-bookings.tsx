"use client";

import { useEffect, useState } from "react";
import type { MentorBookingDto } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { Pagination } from "@devmentor/ui/backend/tables/Pagination";
import { MentorBookingRow } from "@devmentor/ui/components/bookings/MentorBookingRow";
import { ItemGroup } from "@devmentor/ui/components/ui/item";
import { useNow } from "@devmentor/ui/lib/useNow";
import { useTimeZone } from "../../../../lib/use-time-zone";

type MentorBookingsPage = { page: number; pageSize: number; total: number; items: MentorBookingDto[] };

const PAGE_SIZE = 20;

/** The mentor's bookings through `/api/mentor/bookings`: awaiting ones first, with *Accept* and *Decline*. */
export function MentorBookings() {
  const timeZone = useTimeZone();
  const now = useNow();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<MentorBookingsPage>();
  const [error, setError] = useState<ApiError | null>(null);
  // Bumped to load the list again (after a decision or a retry).
  const [reloads, setReloads] = useState(0);
  const reload = () => setReloads((count) => count + 1);

  useEffect(() => {
    const controller = new AbortController();
    apiCall<MentorBookingsPage>(`/api/mentor/bookings?page=${page}&pageSize=${PAGE_SIZE}`, { signal: controller.signal })
      .then((result) => {
        setData(result.ok ? result.data : undefined);
        setError(result.ok ? null : result.error);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [page, reloads]);

  if (error) return <ErrorMessage title="Could not load your bookings" error={error} onRetry={reload} />;
  if (!data || !timeZone) return <LoadingMessage />;
  if (data.total === 0) {
    return <EmptyState title="No bookings yet" description="When a mentee books and pays, the booking waits here for your decision." />;
  }

  const nextAcceptBy = data.items.find((item) => item.status === "awaiting_acceptance")?.id;
  return (
    <div className="flex flex-col gap-in-group">
      <ItemGroup aria-label="Bookings">
        {data.items.map((booking) => (
          <MentorBookingRow
            key={booking.id}
            booking={booking}
            timeZone={timeZone}
            now={now}
            isNext={booking.id === nextAcceptBy}
            onAccept={(target) => apiCall(`/api/mentor/bookings/${target.id}/accept`, { method: "POST" })}
            onDecline={(target, values) => apiCall(`/api/mentor/bookings/${target.id}/decline`, { method: "POST", body: values })}
            onDecided={reload}
            sessionHref={`/mentor/bookings/${booking.id}`}
          />
        ))}
      </ItemGroup>
      {data.total > data.pageSize && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} label="Bookings pages" />}
    </div>
  );
}
