import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useState } from "react";
import { expect, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { EmptyState } from "../../../../src/backend/feedback/EmptyState";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { SlotList, SlotListSkeleton, type Slot } from "../../../../src/components/availability/SlotList";
import { MentorProfileHeader, MentorProfileHeaderSkeleton } from "../../../../src/components/mentors/MentorProfileHeader";
import { PriceList, PriceListSkeleton } from "../../../../src/components/mentors/PriceList";
import type { PublicMentor } from "../../../../src/components/mentors/types";
import { Button } from "../../../../src/components/ui/button";
import { formatDateTime } from "../../../../src/lib/format";
import { respondError, respondNever, respondOk } from "../../../mocks/api";
import { fiveLinks, longBio, manySlots, nav, ownerSlots, publicMentorPartial, publicMentors, timeZone } from "../../../mocks/fixtures";

const SLUG = "marek-zielinski-k3x9q2";
const MENTOR = `/api/mentors/${SLUG}`;
/** `GET /api/mentors/[slug]`: the public profile with its bookable slots (spec E01; the `slots` field name is Q10). */
type MentorPageData = PublicMentor & { slots: Slot[] };

const bookable = ownerSlots.filter((slot) => slot.bookable) as Slot[];
const marek: MentorPageData = {
  ...publicMentors[0],
  bio: "I run the platform team at a payments company: clusters, deploy pipelines and the incidents that come with them.\nBring the error message and what you already tried – we will get your rollout unstuck.",
  links: ["https://github.com/marek-zielinski", "https://kubecon.example/talks/helm-rollbacks-without-tears"],
  slots: bookable,
};

const REASON_ID = "booking-reason";

/**
 * `/m/[slug]` in its E01 form (spec E01, Phase 4; C11, owner decision Q4): profile, prices and bookable
 * times for anyone with the link. *Book* is disabled until booking exists, and the page says why in
 * words – a disabled control with no reason is a dead end (B17). No accent on this page: the choices
 * are equal (Q3). Replaced by `SlotBookActions` when booking ships (E02).
 */
function MentorPageScreen() {
  const [mentor, setMentor] = useState<MentorPageData>();
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await apiCall<MentorPageData>(MENTOR);
    if (!result.ok) return setError(result.error);
    setMentor(result.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  const header = <AppHeader nav={nav.visitor} account={<AccountMenu user={null} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />;

  if (error?.code === "not_found") {
    return (
      <PageLayout header={header} title="Mentor not found">
        <EmptyState
          title="We could not find this mentor"
          description="Check the link you were given, or look at the mentors who are on the list."
          action={
            <a className="link-text" href="/mentors">
              See all mentors
            </a>
          }
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout header={header} title={mentor?.name ?? "Mentor"}>
      {error ? (
        <ErrorMessage title="Could not load this mentor" error={error} onRetry={() => void load()} />
      ) : !mentor ? (
        <div className="flex flex-col gap-section">
          <MentorProfileHeaderSkeleton />
          <PriceListSkeleton />
          <SlotListSkeleton />
        </div>
      ) : (
        <>
          <MentorProfileHeader mentor={mentor} />
          <section aria-labelledby="prices" className="flex max-w-xs flex-col gap-in-group">
            <h2 id="prices" className="type-section-title">
              Prices
            </h2>
            <PriceList price25={mentor.price25} price50={mentor.price50} currency={mentor.currency} />
          </section>
          <section aria-labelledby="times" className="flex flex-col gap-between-groups">
            <div className="flex flex-col gap-in-group">
              <h2 id="times" className="type-section-title">
                Available times
              </h2>
              <p id={REASON_ID} className="max-w-prose type-body text-muted-foreground">
                Booking opens soon. For now you can see when {mentor.name} is free; times are shown in your time zone.
              </p>
            </div>
            <SlotList
              slots={mentor.slots}
              timeZone={timeZone}
              showStatus={false}
              rowActions={(slot) => (
                <Button variant="outline" size="sm" disabled aria-describedby={REASON_ID} aria-label={`Book ${formatDateTime(slot.startsAt, timeZone)}`}>
                  Book
                </Button>
              )}
            />
          </section>
        </>
      )}
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/MentorPage",
  component: MentorPageScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [respondOk("get", MENTOR, marek)] } },
} satisfies Meta<typeof MentorPageScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Profile, both prices and the bookable times, grouped by day. *Book* is disabled with its reason shown. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: "Marek Zieliński" })).toBeInTheDocument();
    await expect(canvas.getByText("PLN 180.00")).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "Thursday 22 October" })).toBeInTheDocument();
  },
};

/** E01: every *Book* is disabled and described by the sentence above the list; no accent on the page (Q3). */
export const BookingNotYetAvailable: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const books = await canvas.findAllByRole("button", { name: /^Book / });
    await expect(books).toHaveLength(3);
    for (const book of books) {
      await expect(book).toBeDisabled();
      await expect(book).toHaveAccessibleDescription(/Booking opens soon/);
      await expect(book).not.toHaveClass("bg-primary");
    }
    await expect(canvas.getByText(/Booking opens soon/)).toBeVisible();
  },
};

/** No bookable times: an empty state, not an error (spec E01, Edge Cases). */
export const NoTimes: Story = {
  parameters: { msw: { handlers: [respondOk("get", MENTOR, { ...marek, slots: [] })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No times available right now")).toBeInTheDocument();
  },
};

/** Optional parts missing: no headline, bio, tags or links; the price not set reads "Not set". */
export const Partial: Story = {
  parameters: { msw: { handlers: [respondOk("get", MENTOR, { ...publicMentorPartial, slots: bookable })] } },
};

/** Long bio, five links, the longest name and sixty slots. */
export const LongText: Story = {
  parameters: {
    msw: {
      handlers: [
        respondOk("get", MENTOR, {
          ...marek,
          name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska",
          headline: "Staff engineer – distributed tracing, Kubernetes operators, Postgres replication and the long tail of on-call lore",
          bio: longBio,
          links: fiveLinks,
          tags: ["TypeScript", "React", "Python", "AI agents"],
          slots: manySlots,
        }),
      ],
    },
  },
};

/** An unknown link: one plain message and the way to the list. */
export const NotFound: Story = {
  parameters: { msw: { handlers: [respondError("get", MENTOR, { status: 404, code: "not_found", message: "Not found" })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("heading", { level: 1, name: "Mentor not found" })).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "See all mentors" })).toHaveAttribute("href", "/mentors");
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", MENTOR)] } } };

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", MENTOR, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
