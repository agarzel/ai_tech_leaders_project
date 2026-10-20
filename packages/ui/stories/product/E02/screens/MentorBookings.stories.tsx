import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { useCallback, useEffect, useRef, useState } from "react";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { EmptyState } from "../../../../src/backend/feedback/EmptyState";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { ResultCount } from "../../../../src/backend/filters/ResultCount";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { MentorBookingRow } from "../../../../src/components/bookings/MentorBookingRow";
import type { MentorBooking } from "../../../../src/components/bookings/types";
import { ItemGroup } from "../../../../src/components/ui/item";
import { Skeleton } from "../../../../src/components/ui/skeleton";
import { useNow } from "../../../../src/lib/useNow";
import { respondError, respondNever } from "../../../mocks/api";
import { bookingsNow, mentorBookingSoon, mentorBookings, nav, signedIn, timeZone } from "../../../mocks/fixtures";

const BOOKINGS = "/api/mentor/bookings";

/** The mentor's bookings, kept by the mock server so decisions show their effect (reset before each story). */
const store = { items: [] as MentorBooking[] };
const start = (list: MentorBooking[]) => () => {
  store.items = list.map((booking) => ({ ...booking }));
};
/** `Page<MentorBookingDto>` plus `pendingCount`: all bookings awaiting a decision, not only those on this page (Q13). */
const page = (items: MentorBooking[]) => ({ items, page: 1, pageSize: 20, total: items.length, pendingCount: items.filter((booking) => booking.status === "awaiting_acceptance").length });

const decide = (id: string, patch: Partial<MentorBooking>) => {
  store.items = store.items.map((booking) => (booking.id === id ? { ...booking, ...patch } : booking));
};

const storeHandlers = [
  http.get(BOOKINGS, () => HttpResponse.json({ ok: true, data: page(store.items) })),
  http.post(`${BOOKINGS}/:id/accept`, ({ params }) => {
    decide(String(params.id), { status: "confirmed" });
    return HttpResponse.json({ ok: true, data: null });
  }),
  http.post(`${BOOKINGS}/:id/decline`, ({ params }) => {
    decide(String(params.id), { status: "declined" });
    return HttpResponse.json({ ok: true, data: null });
  }),
];

/**
 * `/mentor/bookings` (spec E02, #32): bookings awaiting a decision first, nearest deadline first, each
 * with the question, the deadline and *Accept* / *Decline*. The accent is on *Accept* of the nearest
 * deadline only (Q3); the mentee appears by name, never an email. After a decision the list reloads and
 * focus moves to the list heading, because the button that had it is gone.
 */
function MentorBookingsScreen() {
  const now = useNow(bookingsNow);
  const [data, setData] = useState<MentorBooking[]>();
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<ApiError | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await apiCall<{ items: MentorBooking[]; pendingCount: number }>(BOOKINGS);
    if (!result.ok) return setError(result.error);
    setData(result.data.items);
    setPendingCount(result.data.pendingCount);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  const nextId = data?.find((booking) => booking.status === "awaiting_acceptance")?.id;

  return (
    <PageLayout
      header={<AppHeader nav={nav.mentor} currentHref="/mentor/bookings" account={<AccountMenu user={signedIn.mentor} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Bookings"
      description="Read the question, then accept or decline. You can decide until 12 hours before the session; after that the booking expires and the mentee is refunded."
    >
      <section aria-labelledby="bookings-list" className="flex flex-col gap-in-group">
        <h2 id="bookings-list" ref={heading} tabIndex={-1} className="type-section-title outline-none">
          Your bookings
        </h2>
        {error ? (
          <ErrorMessage title="Could not load your bookings" error={error} onRetry={() => void load()} />
        ) : !data ? (
          <div className="flex flex-col gap-in-group" role="status" aria-label="Loading bookings">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : data.length === 0 ? (
          <EmptyState title="No bookings yet" description="Bookings appear here once a mentee has paid. Share your link or stay on the public list." />
        ) : (
          <>
            <ResultCount total={pendingCount} noun="booking waiting for your decision" plural="bookings waiting for your decision" />
            <ItemGroup aria-label="Bookings">
              {data.map((booking) => (
                <MentorBookingRow
                  key={booking.id}
                  booking={booking}
                  timeZone={timeZone}
                  now={now}
                  isNext={booking.id === nextId}
                  onAccept={(target) => apiCall(`${BOOKINGS}/${target.id}/accept`, { method: "POST" })}
                  onDecline={(target, values) => apiCall(`${BOOKINGS}/${target.id}/decline`, { method: "POST", body: values })}
                  onDecided={() => {
                    void load().then(() => heading.current?.focus());
                  }}
                />
              ))}
            </ItemGroup>
          </>
        )}
      </section>
    </PageLayout>
  );
}

const meta = {
  title: "Product/E02/Screens/MentorBookings",
  component: MentorBookingsScreen,
  parameters: { layout: "fullscreen", msw: { handlers: storeHandlers } },
  beforeEach: start(mentorBookings),
} satisfies Meta<typeof MentorBookingsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Waiting bookings first, nearest deadline first; *Accept* of the first is the one accent. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("3 bookings waiting for your decision")).toBeInTheDocument();
    const accepts = canvas.getAllByRole("button", { name: /^Accept / });
    await expect(accepts[0]).toHaveClass("bg-primary");
    await expect(accepts[1]).not.toHaveClass("bg-primary");
    await expect(canvas.queryByText(/@/)).not.toBeInTheDocument();
  },
};

/** A deadline under two hours: "Decide soon" with an icon, and this booking takes the accent. */
export const DeadlineSoon: Story = {
  beforeEach: start([mentorBookingSoon, ...mentorBookings]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Decide soon")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^Accept Marta/ })).toHaveClass("bg-primary");
  },
};

/** *Decline* opens the dialog: the refund is stated, the reason is optional. */
export const Declining: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /^Decline Ola/ }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Decline the booking from Ola Wiśniewska?" });
    fireEvent.change(within(dialog).getByLabelText(/Reason for the mentee/), { target: { value: "I am on leave that week." } });
    await expect(within(dialog).getByText(/\(24 used\)/)).toBeInTheDocument();
  },
};

/** Confirming the decline: the booking leaves the waiting group and shows as declined, focus on the heading. */
export const Declined: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /^Decline Ola/ }));
    await userEvent.click(await within(document.body).findByRole("button", { name: "Decline booking" }));
    await expect(await canvas.findByText("2 bookings waiting for your decision")).toBeInTheDocument();
    await waitFor(() => expect(canvas.getByRole("heading", { name: "Your bookings" })).toHaveFocus());
  },
};

/** *Accept*: the booking is confirmed and the accent moves to the next deadline. */
export const Accepted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /^Accept Ola/ }));
    await expect(await canvas.findByText("2 bookings waiting for your decision")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /^Accept Tomasz/ })).toHaveClass("bg-primary");
  },
};

/** The deadline passed while the page was open: the server refuses, the row says so in words. */
export const DeadlinePassed: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(BOOKINGS, () => HttpResponse.json({ ok: true, data: page(store.items) })),
        respondError("post", `${BOOKINGS}/:id/accept`, { status: 409, code: "conflict", message: "The acceptance deadline has passed." }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /^Accept Ola/ }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("The acceptance deadline has passed.");
  },
};

/** Accepted in another tab: declining is refused inside the dialog. */
export const DeclineRefused: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(BOOKINGS, () => HttpResponse.json({ ok: true, data: page(store.items) })),
        respondError("post", `${BOOKINGS}/:id/decline`, { status: 409, code: "conflict", message: "This booking was already accepted." }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /^Decline Ola/ }));
    await userEvent.click(await within(document.body).findByRole("button", { name: "Decline booking" }));
    await expect(await within(document.body).findByRole("alert")).toHaveTextContent("This booking was already accepted.");
  },
};

export const Empty: Story = {
  beforeEach: start([]),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No bookings yet")).toBeInTheDocument();
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
