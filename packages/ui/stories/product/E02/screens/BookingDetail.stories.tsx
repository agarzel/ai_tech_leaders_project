import type { Meta, StoryObj } from "@storybook/react-vite";
import { http, HttpResponse } from "msw";
import { useCallback, useEffect, useState } from "react";
import { expect, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { EmptyState } from "../../../../src/backend/feedback/EmptyState";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { BookingQuestion } from "../../../../src/components/bookings/BookingQuestion";
import { BookingStatusPanel } from "../../../../src/components/bookings/BookingStatusPanel";
import { BookingSummary } from "../../../../src/components/bookings/BookingSummary";
import type { Booking } from "../../../../src/components/bookings/types";
import { buttonVariants } from "../../../../src/components/ui/button";
import { Skeleton } from "../../../../src/components/ui/skeleton";
import { respondError, respondNever, respondOk } from "../../../mocks/api";
import { bookings, longQuestion, nav, signedIn, timeZone } from "../../../mocks/fixtures";

const BOOKING = "/api/bookings/b1";

/**
 * `/bookings/[id]` (spec E02, #30, #32): where the card payment returns. While the webhook has not
 * landed the page re-checks every `pollMs`; after `giveUpMs` the spinner stops and the page says it will
 * update shortly, and keeps checking ten times slower so that sentence stays true (C67). Then the status
 * and its next action above the fold, the details and the question below. The page does not reveal
 * whether a booking exists: no access and not found are one message (spec E02, API).
 */
function BookingDetailScreen({ pollMs = 3000, giveUpMs = 60000 }: { pollMs?: number; giveUpMs?: number }) {
  const [booking, setBooking] = useState<Booking>();
  const [error, setError] = useState<ApiError | null>(null);
  const [slow, setSlow] = useState(false);

  const load = useCallback(async () => {
    const result = await apiCall<Booking>(BOOKING);
    if (!result.ok) return setError(result.error);
    setError(null);
    setBooking(result.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  const waiting = booking?.status === "pending_payment";
  useEffect(() => {
    if (!waiting) return;
    const toSlow = setTimeout(() => setSlow(true), giveUpMs);
    const every = setInterval(() => void load(), slow ? pollMs * 10 : pollMs);
    return () => {
      clearTimeout(toSlow);
      clearInterval(every);
    };
  }, [waiting, slow, pollMs, giveUpMs, load]);

  const header = <AppHeader nav={nav.mentee} currentHref="/bookings" account={<AccountMenu user={signedIn.mentee} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />;

  if (error?.code === "not_found") {
    return (
      <PageLayout header={header} title="Booking not found">
        <EmptyState
          title="We could not find this booking"
          description="It may not exist, or it may belong to someone else."
          action={
            <a className="link-text" href="/bookings">
              My bookings
            </a>
          }
        />
      </PageLayout>
    );
  }

  const next =
    booking?.status === "payment_expired" && booking.paymentStatus === "expired" ? (
      <a className={buttonVariants()} href={`/m/${booking.mentor.slug}`}>
        Choose a time again
      </a>
    ) : booking && ["declined", "expired"].includes(booking.status) ? (
      <a className={buttonVariants()} href="/mentors">
        Find another mentor
      </a>
    ) : undefined;

  return (
    <PageLayout header={header} title={booking ? `Booking with ${booking.mentor.name}` : "Booking"}>
      {error ? (
        <ErrorMessage title="Could not load this booking" error={error} onRetry={() => void load()} />
      ) : !booking ? (
        <div className="flex flex-col gap-section" role="status" aria-label="Loading booking">
          <Skeleton className="h-16 w-full max-w-prose" />
          <Skeleton className="h-24 w-full max-w-sm" />
        </div>
      ) : (
        <>
          <BookingStatusPanel booking={booking} audience="mentee" timeZone={timeZone} pendingPhase={slow ? "slow" : "checking"} actions={next} />
          <section aria-labelledby="details" className="flex max-w-xl flex-col gap-in-group">
            <h2 id="details" className="type-section-title">
              Details
            </h2>
            <BookingSummary
              mentorName={booking.mentor.name}
              startsAt={booking.startsAt}
              lengthMinutes={booking.lengthMinutes}
              priceAmount={booking.priceAmount}
              currency={booking.currency}
              timeZone={timeZone}
            />
          </section>
          <section aria-labelledby="question" className="flex flex-col gap-in-group">
            <h2 id="question" className="type-section-title">
              Your question
            </h2>
            <BookingQuestion question={booking.question} />
          </section>
        </>
      )}
    </PageLayout>
  );
}

const only = (booking: Booking) => ({ msw: { handlers: [respondOk("get", BOOKING, booking)] } });

const meta = {
  title: "Product/E02/Screens/BookingDetail",
  component: BookingDetailScreen,
  parameters: { layout: "fullscreen", ...only(bookings.waiting) },
} satisfies Meta<typeof BookingDetailScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

const heading = (canvasElement: HTMLElement, name: string | RegExp) => within(canvasElement).findByRole("heading", { level: 2, name });

/** Back from the card payment, the webhook has not landed: "Payment processing…". */
export const Checking: Story = {
  args: { pollMs: 100000 },
  parameters: only(bookings.pending),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Payment processing…")).toBeInTheDocument();
  },
};

/** After about a minute: no spinner, "This page will update shortly". */
export const Slow: Story = {
  args: { pollMs: 100000, giveUpMs: 0 },
  parameters: only(bookings.pending),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "This page will update shortly")).toBeInTheDocument();
  },
};

/** The page re-checks and the webhook lands: processing turns into waiting for the mentor. */
let calls = 0;
export const PaidWhilePolling: Story = {
  args: { pollMs: 200 },
  beforeEach: () => {
    calls = 0;
  },
  parameters: {
    msw: {
      handlers: [http.get(BOOKING, () => HttpResponse.json({ ok: true, data: ++calls < 3 ? bookings.pending : bookings.waiting }))],
    },
  },
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Payment processing…")).toBeInTheDocument();
    await expect(await heading(canvasElement, /^Waiting for Marek Zieliński/)).toBeInTheDocument();
  },
};

export const Waiting: Story = {
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, /^Waiting for Marek Zieliński — they decide by/)).toBeInTheDocument();
    await expect(within(canvasElement).getByText(/After upgrading ingress-nginx/)).toBeInTheDocument();
  },
};

export const Confirmed: Story = {
  parameters: only(bookings.confirmed),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Confirmed")).toBeInTheDocument();
  },
};

/** Declined with the mentor's reason; *Find another mentor* is the one accent. */
export const Declined: Story = {
  parameters: only(bookings.declined),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Declined — refund on its way")).toBeInTheDocument();
    await expect(within(canvasElement).getByRole("link", { name: "Find another mentor" })).toHaveClass("bg-primary");
  },
};

export const DeclinedNoReason: Story = { parameters: only(bookings.declinedNoReason) };

export const Expired: Story = {
  parameters: only(bookings.expired),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Expired — refund on its way")).toBeInTheDocument();
  },
};

export const Refunded: Story = {
  parameters: only(bookings.refunded),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Refunded")).toBeInTheDocument();
  },
};

export const RefundDelayed: Story = {
  parameters: only(bookings.refundDelayed),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Refund delayed — we are on it")).toBeInTheDocument();
  },
};

/** The hold ran out: the time is free again, *Choose a time again* leads back to the mentor. */
export const PaymentNotCompleted: Story = {
  parameters: only(bookings.paymentNotCompleted),
  play: async ({ canvasElement }) => {
    await expect(await heading(canvasElement, "Payment not completed — the time was released")).toBeInTheDocument();
    await expect(within(canvasElement).getByRole("link", { name: "Choose a time again" })).toHaveAttribute("href", expect.stringContaining("/m/"));
  },
};

export const LatePayment: Story = { parameters: only(bookings.latePayment) };

/** No such booking and someone else's booking read the same (spec E02). */
export const NotFound: Story = {
  parameters: { msw: { handlers: [respondError("get", BOOKING, { status: 404, code: "not_found", message: "Not found" })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: "Booking not found" })).toBeInTheDocument();
    await expect(canvas.getAllByRole("link", { name: "My bookings" })).toHaveLength(2);
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", BOOKING)] } } };

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", BOOKING, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

/** A question of 2,000 characters with a pasted log and a very long URL: wraps, no sideways scroll. */
export const LongQuestion: Story = { parameters: only({ ...bookings.waiting, question: longQuestion }) };

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, parameters: only({ ...bookings.declined, question: longQuestion }) };
