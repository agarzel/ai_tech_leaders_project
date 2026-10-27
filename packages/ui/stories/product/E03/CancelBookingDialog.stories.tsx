import type { Meta, StoryObj } from "@storybook/react-vite";

import { CancelBookingDialog } from "../../../src/components/bookings/CancelBookingDialog";

const meta = {
  title: "Product/E03/CancelBookingDialog",
  component: CancelBookingDialog,
  args: {
    mentorName: "Marek Zieliński",
    freeUntil: "2026-11-04T05:00:00Z",
    refundable: true,
    timeZone: "Europe/Warsaw",
    onConfirm: async () => ({ ok: true as const, status: 200, data: {} }),
  },
} satisfies Meta<typeof CancelBookingDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Before the free deadline: the sentence names the deadline and the full refund. */
export const Refundable: Story = {};

/** After the free deadline: the mentor keeps the payment. */
export const AfterDeadline: Story = { args: { refundable: false } };
