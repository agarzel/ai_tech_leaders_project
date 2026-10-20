import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { BookingStatusBadge } from "../../../src/components/bookings/BookingStatusBadge";

const meta = {
  title: "Product/E02/BookingStatusBadge",
  component: BookingStatusBadge,
  args: { status: "awaiting_acceptance", paymentStatus: "paid" },
} satisfies Meta<typeof BookingStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every state of the state machine and the refund phases, as words; none uses the accent. */
export const AllStatuses: Story = {
  render: () => (
    <ul className="flex flex-wrap gap-in-group" aria-label="All booking statuses">
      {(
        [
          ["pending_payment", "open"],
          ["awaiting_acceptance", "paid"],
          ["confirmed", "paid"],
          ["declined", "refund_requested"],
          ["declined", "refunded"],
          ["declined", "refund_failed"],
          ["expired", "refund_requested"],
          ["expired", "refunded"],
          ["expired", "refund_failed"],
          ["payment_expired", "expired"],
        ] as const
      ).map(([status, paymentStatus]) => (
        <li key={`${status}-${paymentStatus}`}>
          <BookingStatusBadge status={status} paymentStatus={paymentStatus} />
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("listitem")).toHaveLength(10);
  },
};

export const Confirmed: Story = { args: { status: "confirmed" } };
export const Declined: Story = { args: { status: "declined", paymentStatus: "refund_requested" } };
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { status: "declined", paymentStatus: "refund_failed" } };
