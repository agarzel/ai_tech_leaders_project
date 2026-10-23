import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { focusState, hoverState, StateMatrix } from "../../../.storybook/blocks/Docs";
import { OfferChecklist, OfferChecklistSkeleton } from "../../../src/components/mentors/OfferChecklist";
import { shareUrl } from "../../mocks/fixtures";

const hrefs = { profile: "/mentor/profile", slots: "/mentor/slots" };

const meta = {
  title: "Product/E01/OfferChecklist",
  component: OfferChecklist,
  args: { profileComplete: true, pricesSet: true, bookableSlots: 2, slotsTooSoon: 0, shareUrl, listed: false, hrefs },
  argTypes: { hrefs: { table: { disable: true } }, renderLink: { table: { disable: true } } },
} satisfies Meta<typeof OfferChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Bookable, not on the public list (the list is optional – R08). */
export const Playground: Story = {};

/** First visit after the invitation: everything to do; *Complete profile* is the one accent. */
export const NewMentor: Story = {
  args: { profileComplete: false, pricesSet: false, bookableSlots: 0, slotsTooSoon: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Your link appears here once you save your profile.")).toBeInTheDocument();
    await expect(canvas.queryByLabelText("Your share link")).not.toBeInTheDocument();
  },
};

/** Profile and prices set, no times yet. */
export const NoTimes: Story = { args: { bookableSlots: 0 } };

/** Times exist but all start within 24 hours – nobody can book them (D13). */
export const SlotsTooSoon: Story = { args: { bookableSlots: 0, slotsTooSoon: 2 } };

/** Opted in to the list but not bookable yet: says why the mentor is not shown. */
export const ListedNotBookable: Story = { args: { pricesSet: false, listed: true } };

/** Everything done, on the public list. */
export const Listed: Story = { args: { listed: true } };

export const Loading: Story = { render: () => <OfferChecklistSkeleton /> };

/** Action links: default (outline), next action (accent), hover, focus – frozen previews. */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Checklist action states"
      rows={["Next step (accent)", "Other step"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(row, state) => (
        <OfferChecklist
          profileComplete={row !== "Next step (accent)"}
          pricesSet
          bookableSlots={1}
          slotsTooSoon={0}
          shareUrl={shareUrl}
          listed
          hrefs={hrefs}
          renderLink={(props) => (String(props["aria-label"]).endsWith(": Profile") ? <a {...props} {...state.props} /> : null)}
        />
      )}
    />
  ),
};

/** At 320 px the action moves under the text; the share link scrolls inside its field. */
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { pricesSet: false } };

/** Only the first unfinished step gets the accent; each action names its step for screen readers. */
export const OneAccent: Story = {
  args: { profileComplete: true, pricesSet: false, bookableSlots: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: "Set prices: Prices" })).toHaveClass("bg-primary");
    await expect(canvas.getByRole("link", { name: "Add a time: A time mentees can book" })).not.toHaveClass("bg-primary");
  },
};
