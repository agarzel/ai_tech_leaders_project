import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { PendingBookingsNotice } from "../../../src/components/bookings/PendingBookingsNotice";
import { bookingsNow, timeZone } from "../../mocks/fixtures";

const meta = {
  title: "Product/E02/PendingBookingsNotice",
  component: PendingBookingsNotice,
  args: { count: 2, earliestAcceptBy: "2026-10-27T04:00:00Z", href: "/mentor/bookings", now: bookingsNow, timeZone },
  argTypes: { now: { control: "date" }, renderLink: { table: { disable: true } } },
} satisfies Meta<typeof PendingBookingsNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The count in a sentence, the nearest deadline and one accent link (Q2). */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("2 bookings waiting for your decision")).toBeInTheDocument();
  },
};

export const One: Story = { args: { count: 1 } };

/** Nothing pending: nothing is rendered. */
export const None: Story = { args: { count: 0 } };

/** The nearest deadline is under two hours. */
export const DeadlineSoon: Story = { args: { earliestAcceptBy: "2026-10-26T21:30:00Z" } };

/** On a page that already has its accent, the link is quiet. */
export const WithoutAccent: Story = { args: { emphasis: false } };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
