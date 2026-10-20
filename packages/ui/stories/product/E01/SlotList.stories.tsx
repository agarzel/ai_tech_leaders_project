import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { SlotList, SlotListSkeleton } from "../../../src/components/availability/SlotList";
import { Button } from "../../../src/components/ui/button";
import { manySlots, ownerSlots, slots, timeZone } from "../../mocks/fixtures";

type Slot = { id: string; startsAt: string; status: "open" | "booked"; bookable: boolean };
const asSlots = (list: unknown) => list as Slot[];

const meta = {
  title: "Product/E01/SlotList",
  component: SlotList,
  args: { slots: asSlots(ownerSlots), timeZone },
  argTypes: { rowActions: { table: { disable: true } }, onRetry: { table: { disable: true } }, slots: { control: "object" } },
} satisfies Meta<typeof SlotList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The owner's view: every slot with its status in words – open, too soon (D13), booked. */
export const Playground: Story = {};

/** The public view: only bookable slots, so the status is left out and the row keeps its zone label. */
export const Public: Story = {
  args: { slots: asSlots(ownerSlots.filter((slot) => slot.bookable)), showStatus: false },
};

/** Row actions sit on the right and name their slot, because rows repeat. */
export const WithRowActions: Story = {
  args: {
    rowActions: (slot) => (
      <Button variant="outline" size="sm" aria-label={`Select ${slot.id}`}>
        Select
      </Button>
    ),
  },
};

/** Sixty slots over twenty days, grouped by day. */
export const Many: Story = { args: { slots: asSlots(manySlots) } };

/** The viewer is in Tokyo: the same instants fall on different days and hours; the label says which zone. */
export const ViewerInOtherZone: Story = {
  args: { slots: asSlots(ownerSlots.filter((slot) => slot.bookable)), timeZone: "Asia/Tokyo", showStatus: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Friday 23 October" })).toBeInTheDocument();
    await expect(canvas.getAllByText("Asia/Tokyo, UTC+9").length).toBeGreaterThan(0);
  },
};

/** Late evening and just after midnight in the viewer's zone land under different days. */
export const AcrossMidnight: Story = {
  args: {
    slots: [
      { id: "a", startsAt: "2026-11-04T22:30:00Z", status: "open", bookable: true },
      { id: "b", startsAt: "2026-11-04T23:30:00Z", status: "open", bookable: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Wednesday 4 November" })).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { name: "Thursday 5 November" })).toBeInTheDocument();
  },
};

/** The owner sees why a slot cannot be booked; a mentee never sees such slots. */
export const TooSoon: Story = { args: { slots: asSlots(slots.tooSoon) } };

export const Loading: Story = { render: () => <SlotListSkeleton /> };

/** The public empty state: no times is a normal situation, not an error (spec E01). */
export const Empty: Story = { args: { slots: [] } };

/** The owner's empty state says what to do next. */
export const EmptyOwner: Story = {
  args: { slots: [], emptyTitle: "No slots yet", emptyDescription: "Add the first time mentees can book you with the form above." },
};

/** A failed load names the cause and offers *Try again*. */
export const Error: Story = {
  args: { slots: undefined, error: { code: "network_error", message: "Failed to fetch" }, onRetry: fn() },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Try again" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
