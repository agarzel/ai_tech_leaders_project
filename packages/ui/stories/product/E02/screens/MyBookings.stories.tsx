import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { useCallback, useEffect, useId, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { EmptyState } from "../../../../src/backend/feedback/EmptyState";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { ActiveFilters } from "../../../../src/backend/filters/ActiveFilters";
import { ResultCount } from "../../../../src/backend/filters/ResultCount";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { Pagination } from "../../../../src/backend/tables/Pagination";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { BookingRow } from "../../../../src/components/bookings/BookingRow";
import type { Booking, BookingStatus } from "../../../../src/components/bookings/types";
import { Button, buttonVariants } from "../../../../src/components/ui/button";
import { Field, FieldLabel } from "../../../../src/components/ui/field";
import { ItemGroup } from "../../../../src/components/ui/item";
import { NativeSelect, NativeSelectOption } from "../../../../src/components/ui/native-select";
import { Skeleton } from "../../../../src/components/ui/skeleton";
import { respondError, respondNever } from "../../../mocks/api";
import { manyBookings, menteeBookings, nav, signedIn, timeZone } from "../../../mocks/fixtures";

const BOOKINGS = "/api/bookings";
const PAGE_SIZE = 10;
type Page = { items: Booking[]; page: number; pageSize: number; total: number };

const STATUSES: { value: BookingStatus; label: string }[] = [
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "awaiting_acceptance", label: "Waiting for the mentor" },
  { value: "confirmed", label: "Confirmed" },
  { value: "declined", label: "Declined" },
  { value: "expired", label: "Expired" },
  { value: "payment_expired", label: "Payment not completed" },
];

/** A mock `GET /api/bookings?status&page&pageSize` over a fixed set (`Page<BookingDto>`; the `status` filter is Q13). */
function bookingsApi(all: Booking[]) {
  return http.get(BOOKINGS, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") ?? 1);
    const matching = status ? all.filter((booking) => booking.status === status) : all;
    const data: Page = { items: matching.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pageSize: PAGE_SIZE, total: matching.length };
    return HttpResponse.json({ ok: true, data });
  });
}

/**
 * `/bookings` (spec E02, UI/UX): the mentee's own bookings, filtered by status, as dense rows with the
 * status in words. Same pattern as `/mentors`: count, the filter in effect, and two different empty
 * states – no booking has this status (*Clear filters*) versus no booking yet (*Find a mentor*, the one
 * accent, because there is a next step).
 */
function MyBookingsScreen({ initialStatus = "" }: { initialStatus?: BookingStatus | "" }) {
  const selectId = useId();
  const [status, setStatus] = useState<BookingStatus | "">(initialStatus);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE), ...(status ? { status } : {}) });
    const result = await apiCall<Page>(`${BOOKINGS}?${query}`);
    setIsLoading(false);
    if (!result.ok) return setError(result.error);
    setData(result.data);
  }, [page, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching when the filter or page changes is the intended effect
    void load();
  }, [load]);

  const label = STATUSES.find((item) => item.value === status)?.label;
  const filters = status ? [{ key: "status", label: `Status: ${label}` }] : [];
  const clear = () => {
    setStatus("");
    setPage(1);
  };

  return (
    <PageLayout
      header={<AppHeader nav={nav.mentee} currentHref="/bookings" account={<AccountMenu user={signedIn.mentee} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="My bookings"
      description="Your questions and where each one stands. Times are shown in your time zone."
    >
      <div className="flex flex-col gap-in-group">
        <Field className="max-w-56">
          <FieldLabel htmlFor={selectId}>Status</FieldLabel>
          <NativeSelect
            id={selectId}
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as BookingStatus | "");
              setPage(1);
            }}
          >
            <NativeSelectOption value="">All</NativeSelectOption>
            {STATUSES.map((item) => (
              <NativeSelectOption key={item.value} value={item.value}>
                {item.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <ActiveFilters filters={filters} onRemove={clear} onClearAll={clear} label="Booking filters" />
      </div>

      <section aria-label="Booking list" className="flex flex-col gap-in-group">
        {error ? (
          <ErrorMessage title="Could not load your bookings" error={error} onRetry={() => void load()} />
        ) : !data ? (
          <div className="flex flex-col gap-in-group" role="status" aria-label="Loading bookings">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : (
          <>
            <ResultCount total={data.total} noun="booking" isLoading={isLoading} />
            {data.total === 0 ? (
              status ? (
                <EmptyState
                  title="No bookings with this status"
                  description={`None of your bookings is “${label}”.`}
                  action={
                    <Button variant="outline" onClick={clear}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  title="No bookings yet"
                  description="When you book a session it appears here with its status."
                  action={
                    <a className={buttonVariants()} href="/mentors">
                      Find a mentor
                    </a>
                  }
                />
              )
            ) : (
              <>
                <ItemGroup aria-label="Bookings">
                  {data.items.map((booking) => (
                    <BookingRow key={booking.id} booking={booking} href={`/bookings/${booking.id}`} timeZone={timeZone} />
                  ))}
                </ItemGroup>
                {data.total > PAGE_SIZE && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} isLoading={isLoading} label="Bookings pages" />}
              </>
            )}
          </>
        )}
      </section>
    </PageLayout>
  );
}

const meta = {
  title: "Product/E02/Screens/MyBookings",
  component: MyBookingsScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [bookingsApi(menteeBookings)] } },
} satisfies Meta<typeof MyBookingsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Six bookings in different states, each with its status in words. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("6 bookings")).toBeInTheDocument();
    await expect(canvas.getByText("Awaiting mentor")).toBeInTheDocument();
    await expect(canvas.queryByRole("group", { name: "Booking filters" })).not.toBeInTheDocument();
  },
};

/** Choosing a status filters the list; the filter is shown and removable. */
export const Filtered: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.selectOptions(await canvas.findByLabelText("Status"), "declined");
    await expect(await canvas.findByText("1 booking")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Remove filter: Status: Declined" })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(await canvas.findByText("6 bookings")).toBeInTheDocument();
  },
};

/** No booking has this status: say so and offer *Clear filters*. */
export const NoResults: Story = {
  args: { initialStatus: "pending_payment" },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No bookings with this status")).toBeInTheDocument();
  },
};

/** No booking at all: the next step is the one accent – *Find a mentor*. */
export const NothingYet: Story = {
  parameters: { msw: { handlers: [bookingsApi([])] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("No bookings yet")).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Find a mentor" })).toHaveClass("bg-primary");
    await expect(canvas.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  },
};

/** Thirty bookings in pages of ten. */
export const Many: Story = {
  parameters: { msw: { handlers: [bookingsApi(manyBookings)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("30 bookings")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(await canvas.findByText("11–20 of 30")).toBeInTheDocument();
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", BOOKINGS)] } } };

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", BOOKINGS, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
