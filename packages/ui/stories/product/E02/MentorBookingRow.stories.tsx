import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import type { ApiResult } from "../../../src/backend/api/types";
import { MentorBookingRow } from "../../../src/components/bookings/MentorBookingRow";
import { ItemGroup } from "../../../src/components/ui/item";
import { bookingsNow, mentorBookingSoon, mentorBookings, timeZone } from "../../mocks/fixtures";

const ok: ApiResult<unknown> = { ok: true, data: null, status: 200 };

const meta = {
  title: "Product/E02/MentorBookingRow",
  component: MentorBookingRow,
  args: {
    booking: mentorBookings[0],
    timeZone,
    now: bookingsNow,
    onAccept: fn(async (): Promise<ApiResult<unknown>> => ok),
    onDecline: fn(async (): Promise<ApiResult<unknown>> => ok),
    onDecided: fn(),
  },
  argTypes: { booking: { control: "object" }, now: { control: "date" }, onAccept: { table: { disable: true } }, onDecline: { table: { disable: true } }, onDecided: { table: { disable: true } } },
  render: (args) => (
    <ItemGroup aria-label="Bookings">
      <MentorBookingRow {...args} />
    </ItemGroup>
  ),
} satisfies Meta<typeof MentorBookingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Awaiting a decision: mentee by name, slot, deadline, question, *Accept* and *Decline* (equal). */
export const Playground: Story = {};

/** The booking with the nearest deadline gets the accent on *Accept* (Q3). */
export const NextDeadline: Story = {
  args: { isNext: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: /^Accept/ })).toHaveClass("bg-primary");
  },
};

/** Under two hours: "Decide soon" with an icon. */
export const DeadlineSoon: Story = { args: { booking: mentorBookingSoon, isNext: true } };

/** A 2,000-character question is cut to a preview with *Show full question*. */
export const LongQuestion: Story = {
  args: { booking: mentorBookings[2] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Show full question" }));
    await expect(canvas.getByRole("button", { name: "Show less" })).toHaveAttribute("aria-expanded", "true");
  },
};

/** *Accept* reports the decision when the server confirms. */
export const Accepting: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: /^Accept/ }));
    await waitFor(() => expect(args.onDecided).toHaveBeenCalled());
  },
};

/** The deadline passed meanwhile (`conflict`): explained under the row, the mentor can still decline. */
export const DeadlinePassed: Story = {
  args: { onAccept: fn(async (): Promise<ApiResult<unknown>> => ({ ok: false, error: { code: "conflict", message: "The acceptance deadline has passed." }, status: 409 })) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /^Accept/ }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("The acceptance deadline has passed.");
  },
};

/** Already decided: the status in words instead of actions. */
export const Confirmed: Story = { args: { booking: mentorBookings[3] } };
export const Declined: Story = { args: { booking: mentorBookings[4] } };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { booking: mentorBookings[2], isNext: true } };
