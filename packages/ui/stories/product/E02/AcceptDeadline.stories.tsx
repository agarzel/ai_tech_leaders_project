import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { AcceptDeadline } from "../../../src/components/bookings/AcceptDeadline";
import { bookingsNow, timeZone } from "../../mocks/fixtures";

const meta = {
  title: "Product/E02/AcceptDeadline",
  component: AcceptDeadline,
  args: { acceptBy: "2026-10-27T04:00:00Z", now: bookingsNow, timeZone },
  argTypes: { now: { control: "date" } },
} satisfies Meta<typeof AcceptDeadline>;

export default meta;
type Story = StoryObj<typeof meta>;

/** More than two hours: the time with its zone and "in 8 h". */
export const MoreThanTwoHours: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Decide by/)).toHaveTextContent("in 8 h");
    await expect(within(canvasElement).queryByText("Decide soon")).not.toBeInTheDocument();
  },
};

/** Under two hours: "Decide soon" with an icon – urgency in words, not only colour (C12). */
export const UnderTwoHours: Story = {
  args: { acceptBy: "2026-10-26T21:30:00Z" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Decide soon")).toBeInTheDocument();
  },
};

/** The deadline is past: said plainly; the server refuses an acceptance now (`conflict`). */
export const Passed: Story = {
  args: { acceptBy: "2026-10-26T19:40:00Z" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Deadline passed/)).toHaveTextContent("20 min ago");
  },
};

/** In minutes, close to the deadline. */
export const InMinutes: Story = { args: { acceptBy: "2026-10-26T20:12:00Z" } };

/** The mentor in another zone: the same instant, the zone named. */
export const OtherTimeZone: Story = { args: { timeZone: "America/New_York" } };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { acceptBy: "2026-10-26T21:30:00Z" } };
