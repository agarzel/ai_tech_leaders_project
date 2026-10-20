import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import type { MentorProfile } from "../../../../src/components/mentors/MentorProfileForm";
import { PendingBookingsNotice } from "../../../../src/components/bookings/PendingBookingsNotice";
import type { MentorBooking } from "../../../../src/components/bookings/types";
import { OfferChecklist, OfferChecklistSkeleton } from "../../../../src/components/mentors/OfferChecklist";
import { respondError, respondNever, respondOk } from "../../../mocks/api";
import { bookingsNow, mentorBookings, mentorProfile, nav, newMentorProfile, signedIn, slots, timeZone } from "../../../mocks/fixtures";

const PROFILE = "/api/mentor/profile";
const SLOTS = "/api/mentor/slots";
const BOOKINGS = "/api/mentor/bookings";

/** `SlotDto` from `GET /api/mentor/slots` (spec E01, Q9); `bookable` is computed by the server. */
type SlotDto = { id: string; startsAt: string; status: "open" | "booked"; bookable: boolean };
type Data = { profile: MentorProfile; slots: SlotDto[]; pendingCount: number; earliestAcceptBy: string | null };

/**
 * `/mentor` (spec E01, UI/UX): the checklist that drives a mentor to bookable. Reads the own profile and
 * slots (MSW answers); "profile complete" = name + headline (spec E01, Q8); slot counts from `SlotDto.bookable` (Q9).
 */
function MentorHomeScreen() {
  const [data, setData] = useState<Data>();
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [profile, own, bookings] = await Promise.all([apiCall<MentorProfile>(PROFILE), apiCall<SlotDto[]>(SLOTS), apiCall<{ items: MentorBooking[]; pendingCount: number }>(BOOKINGS)]);
    if (!profile.ok) return setError(profile.error);
    if (!own.ok) return setError(own.error);
    // The notice is secondary: if the bookings cannot be read the checklist is still shown.
    // `pendingCount` counts every booking awaiting a decision (Q13); the list puts those first, nearest deadline first.
    const pendingCount = bookings.ok ? bookings.data.pendingCount : 0;
    const earliestAcceptBy = bookings.ok ? (bookings.data.items[0]?.acceptBy ?? null) : null;
    setData({ profile: profile.data, slots: own.data, pendingCount, earliestAcceptBy });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  const open = data?.slots.filter((slot) => slot.status === "open") ?? [];

  return (
    <PageLayout
      header={<AppHeader nav={nav.mentor} currentHref="/mentor" account={<AccountMenu user={signedIn.mentor} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Overview"
      description="What mentees need before they can book you."
    >
      {error ? (
        <ErrorMessage title="Could not load your offer" error={error} onRetry={() => void load()} />
      ) : !data ? (
        <OfferChecklistSkeleton />
      ) : (
        <>
          {data.pendingCount > 0 && data.earliestAcceptBy && (
            <PendingBookingsNotice
              count={data.pendingCount}
              earliestAcceptBy={data.earliestAcceptBy}
              href="/mentor/bookings"
              now={bookingsNow}
              timeZone={timeZone}
              emphasis={Boolean(data.profile.headline) && data.profile.price25 !== null && data.profile.price50 !== null && open.some((slot) => slot.bookable)}
            />
          )}
        <OfferChecklist
          profileComplete={Boolean(data.profile.name.trim() && data.profile.headline?.trim())}
          pricesSet={data.profile.price25 !== null && data.profile.price50 !== null}
          bookableSlots={open.filter((slot) => slot.bookable).length}
          slotsTooSoon={open.filter((slot) => !slot.bookable).length}
          shareUrl={`https://devmentor.example/m/${data.profile.shareSlug}`}
          listed={data.profile.listed}
          hrefs={{ profile: "/mentor/profile", slots: "/mentor/slots" }}
        />
        </>
      )}
    </PageLayout>
  );
}

const page = (items: unknown[]) => ({ items, page: 1, pageSize: 20, total: items.length, pendingCount: (items as MentorBooking[]).filter((booking) => booking.status === "awaiting_acceptance").length });
const handlers = (profile: unknown, own: unknown, pending: unknown[] = []) => [respondOk("get", PROFILE, profile), respondOk("get", SLOTS, own), respondOk("get", BOOKINGS, page(pending))];

const meta = {
  title: "Product/E01/Screens/MentorHome",
  component: MentorHomeScreen,
  parameters: { layout: "fullscreen", msw: { handlers: handlers(mentorProfile, slots.bookable) } },
} satisfies Meta<typeof MentorHomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bookable and on the public list. */
export const Listed: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("You are on the public list of mentors.")).toBeInTheDocument();
  },
};

/** First visit after the invitation: the lazily created profile, no prices, no times. */
export const NewMentor: Story = { parameters: { msw: { handlers: handlers(newMentorProfile, slots.none) } } };

/** Profile and prices done, no times yet. */
export const NoTimes: Story = { parameters: { msw: { handlers: handlers({ ...mentorProfile, listed: false }, slots.none) } } };

/** Bookable and listed, with two bookings waiting for a decision: the count in a sentence, the nearest deadline, one accent (Q2, Q3). */
export const WithPending: Story = {
  parameters: { msw: { handlers: handlers(mentorProfile, slots.bookable, mentorBookings.filter((booking) => booking.status === "awaiting_acceptance")) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("3 bookings waiting for your decision")).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Review bookings" })).toHaveClass("bg-primary");
  },
};

/** The profile is not finished: the checklist keeps the accent, the notice is quiet (one accent per screen). */
export const WithPendingIncompleteOffer: Story = {
  parameters: { msw: { handlers: handlers(newMentorProfile, slots.none, mentorBookings.slice(0, 1)) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("link", { name: "Review bookings" })).not.toHaveClass("bg-primary");
    await expect(canvas.getByRole("link", { name: "Complete profile: Profile" })).toHaveClass("bg-primary");
  },
};

/** Only times inside 24 hours (D13). */
export const SlotsTooSoon: Story = {
  parameters: { msw: { handlers: handlers(mentorProfile, slots.tooSoon) } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/start within 24 hours/)).toBeInTheDocument();
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", PROFILE), respondNever("get", SLOTS), respondNever("get", BOOKINGS)] } } };

/** Loading failed: explained, with *Try again*. */
export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", PROFILE, { status: 500, code: "internal_error", message: "Internal server error" }), respondOk("get", SLOTS, []), respondOk("get", BOOKINGS, page([]))] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Something went wrong on our side");
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, parameters: { msw: { handlers: handlers(newMentorProfile, slots.none) } } };
