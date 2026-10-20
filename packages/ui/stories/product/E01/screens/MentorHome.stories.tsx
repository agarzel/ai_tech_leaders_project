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
import { OfferChecklist, OfferChecklistSkeleton } from "../../../../src/components/mentors/OfferChecklist";
import { respondError, respondNever, respondOk } from "../../../mocks/api";
import { mentorProfile, nav, newMentorProfile, signedIn, slots } from "../../../mocks/fixtures";

const PROFILE = "/api/mentor/profile";
const SLOTS = "/api/mentor/slots";

/** `SlotDto` from `GET /api/mentor/slots` (spec E01, Q9); `bookable` is computed by the server. */
type SlotDto = { id: string; startsAt: string; status: "open" | "booked"; bookable: boolean };
type Data = { profile: MentorProfile; slots: SlotDto[] };

/**
 * `/mentor` (spec E01, UI/UX): the checklist that drives a mentor to bookable. Reads the own profile and
 * slots (MSW answers); "profile complete" = name + headline (spec E01, Q8); slot counts from `SlotDto.bookable` (Q9).
 */
function MentorHomeScreen() {
  const [data, setData] = useState<Data>();
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [profile, own] = await Promise.all([apiCall<MentorProfile>(PROFILE), apiCall<SlotDto[]>(SLOTS)]);
    if (!profile.ok) return setError(profile.error);
    if (!own.ok) return setError(own.error);
    setData({ profile: profile.data, slots: own.data });
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
        <OfferChecklist
          profileComplete={Boolean(data.profile.name.trim() && data.profile.headline?.trim())}
          pricesSet={data.profile.price25 !== null && data.profile.price50 !== null}
          bookableSlots={open.filter((slot) => slot.bookable).length}
          slotsTooSoon={open.filter((slot) => !slot.bookable).length}
          shareUrl={`https://devmentor.example/m/${data.profile.shareSlug}`}
          listed={data.profile.listed}
          hrefs={{ profile: "/mentor/profile", slots: "/mentor/slots" }}
        />
      )}
    </PageLayout>
  );
}

const handlers = (profile: unknown, own: unknown) => [respondOk("get", PROFILE, profile), respondOk("get", SLOTS, own)];

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

/** Only times inside 24 hours (D13). */
export const SlotsTooSoon: Story = {
  parameters: { msw: { handlers: handlers(mentorProfile, slots.tooSoon) } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/start within 24 hours/)).toBeInTheDocument();
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", PROFILE), respondNever("get", SLOTS)] } } };

/** Loading failed: explained, with *Try again*. */
export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", PROFILE, { status: 500, code: "internal_error", message: "Internal server error" }), respondOk("get", SLOTS, [])] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Something went wrong on our side");
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, parameters: { msw: { handlers: handlers(newMentorProfile, slots.none) } } };
