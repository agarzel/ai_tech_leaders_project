"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BookingDto } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { Pagination } from "@devmentor/ui/backend/tables/Pagination";
import { BookingRow } from "@devmentor/ui/components/bookings/BookingRow";
import { ItemGroup } from "@devmentor/ui/components/ui/item";
import { buttonVariants } from "@devmentor/ui/components/ui/button";
import { renderNextLink } from "../../../components/render-next-link";
import { useTimeZone } from "../../../lib/use-time-zone";

type BookingsPage = { page: number; pageSize: number; total: number; items: BookingDto[] };

const PAGE_SIZE = 20;

/** The caller's own bookings through `GET /api/bookings`, in the browser's time zone. */
export function BookingsList() {
  const timeZone = useTimeZone();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BookingsPage>();
  const [error, setError] = useState<ApiError | null>(null);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    apiCall<BookingsPage>(`/api/bookings?page=${page}&pageSize=${PAGE_SIZE}`, { signal: controller.signal })
      .then((result) => {
        setData(result.ok ? result.data : undefined);
        setError(result.ok ? null : result.error);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [page, reloads]);

  if (error) return <ErrorMessage title="Could not load your bookings" error={error} onRetry={() => setReloads((count) => count + 1)} />;
  if (!data || !timeZone) return <LoadingMessage />;
  if (data.total === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        description="Pick a mentor and a time to book your first session."
        action={
          <Link href="/mentors" className={buttonVariants()}>
            Find a mentor
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-in-group">
      <ItemGroup aria-label="Your bookings">
        {data.items.map((booking) => (
          <BookingRow key={booking.id} booking={booking} href={`/bookings/${booking.id}`} timeZone={timeZone} renderLink={renderNextLink} />
        ))}
      </ItemGroup>
      {data.total > data.pageSize && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} label="Bookings pages" />}
    </div>
  );
}
