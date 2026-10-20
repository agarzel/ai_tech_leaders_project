import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { BookingStatusPanel } from "../../../src/components/bookings/BookingStatusPanel";
import { buttonVariants } from "../../../src/components/ui/button";
import { bookings, timeZone } from "../../mocks/fixtures";

const findMentor = <a className={buttonVariants()} href="/mentors">Find another mentor</a>;

const meta = {
  title: "Product/E02/BookingStatusPanel",
  component: BookingStatusPanel,
  args: { booking: bookings.waiting, audience: "mentee", timeZone },
  argTypes: { booking: { control: "object" }, actions: { table: { disable: true } } },
} satisfies Meta<typeof BookingStatusPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const title = (canvasElement: HTMLElement, name: string | RegExp) => expect(within(canvasElement).getByRole("heading", { name })).toBeInTheDocument();

/** Paid; the mentor has not decided. The title already says by when. */
export const WaitingMentee: Story = {
  play: async ({ canvasElement }) => title(canvasElement, "Waiting for Marek Zieliński — they decide by Tue 27 Oct, 05:00 (Europe/Warsaw, UTC+1)"),
};
export const WaitingMentor: Story = {
  args: { audience: "mentor" },
  play: async ({ canvasElement }) => title(canvasElement, /^Waiting for your decision — decide by/),
};

export const ConfirmedMentee: Story = { args: { booking: bookings.confirmed }, play: async ({ canvasElement }) => title(canvasElement, "Confirmed") };
export const ConfirmedMentor: Story = { args: { booking: bookings.confirmed, audience: "mentor" } };

/** Declined with the mentor's reason, refund requested; the next action is the page's accent. */
export const DeclinedMentee: Story = {
  args: { booking: bookings.declined, actions: findMentor },
  play: async ({ canvasElement }) => {
    await title(canvasElement, "Declined — refund on its way");
    await expect(within(canvasElement).getByText(/on leave that week/)).toBeInTheDocument();
  },
};
export const DeclinedNoReason: Story = { args: { booking: bookings.declinedNoReason, actions: findMentor } };
export const DeclinedMentor: Story = { args: { booking: bookings.declined, audience: "mentor" }, play: async ({ canvasElement }) => expect(within(canvasElement).queryByText(/on leave that week/)).not.toBeInTheDocument() };

export const ExpiredMentee: Story = { args: { booking: bookings.expired, actions: findMentor }, play: async ({ canvasElement }) => title(canvasElement, "Expired — refund on its way") };
export const ExpiredMentor: Story = { args: { booking: bookings.expired, audience: "mentor" } };

/** The refund went through; banks take a few days to show it. */
export const Refunded: Story = { args: { booking: bookings.refunded, actions: findMentor }, play: async ({ canvasElement }) => title(canvasElement, "Refunded") };

/** The refund has not gone through after retries: said plainly, nothing to do (spec E02). */
export const RefundDelayed: Story = { args: { booking: bookings.refundDelayed }, play: async ({ canvasElement }) => title(canvasElement, "Refund delayed — we are on it") };

/** The hold ran out before the payment finished; the time is free again. */
export const PaymentNotCompleted: Story = {
  args: { booking: bookings.paymentNotCompleted, actions: <a className={buttonVariants()} href="/m/marek">Choose a time again</a> },
  play: async ({ canvasElement }) => title(canvasElement, "Payment not completed — the time was released"),
};

/** A payment that arrived after the release is refunded in full (spec E02, "late paid webhook"). */
export const LatePayment: Story = { args: { booking: bookings.latePayment }, play: async ({ canvasElement }) => title(canvasElement, "Payment arrived too late — refund on its way") };

/** Awaiting payment is `PaymentPending`: checking, then slow. */
export const PaymentChecking: Story = { args: { booking: bookings.pending } };
export const PaymentSlow: Story = { args: { booking: bookings.pending, pendingPhase: "slow" } };

/** A long reason from the mentor wraps; at 320 px the action sits under the text. */
export const LongReasonNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: {
    booking: { ...bookings.declined, declineReason: "I am on leave that week and the week after, and then the whole of November is taken by a migration I cannot move, so please pick a time in December or write to another mentor." },
    actions: findMentor,
  },
};
