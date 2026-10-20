import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { PaymentPending } from "../../../src/components/bookings/PaymentPending";

const meta = { title: "Product/E02/PaymentPending", component: PaymentPending, args: { phase: "checking" } } satisfies Meta<typeof PaymentPending>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right after Checkout: a spinner and "Payment processing…". */
export const Checking: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { name: "Payment processing…" })).toBeInTheDocument();
  },
};

/** After about a minute: no spinner, "This page will update shortly". */
export const Slow: Story = {
  args: { phase: "slow" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { name: "This page will update shortly" })).toBeInTheDocument();
  },
};

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
