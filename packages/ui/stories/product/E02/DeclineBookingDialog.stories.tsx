import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../src/backend/api/apiCall";
import { DeclineBookingDialog } from "../../../src/components/bookings/DeclineBookingDialog";
import { respondError, respondNever, respondOk } from "../../mocks/api";
import { timeZone } from "../../mocks/fixtures";

const DECLINE = "/api/mentor/bookings/mb1/decline";

const meta = {
  title: "Product/E02/DeclineBookingDialog",
  component: DeclineBookingDialog,
  args: {
    menteeName: "Ola Wiśniewska",
    startsAt: "2026-10-27T16:00:00Z",
    timeZone,
    onConfirm: (values) => apiCall(DECLINE, { method: "POST", body: values }),
  },
  argTypes: { onConfirm: { table: { disable: true } }, onDeclined: { table: { disable: true } } },
  parameters: { a11y: { context: "body" }, msw: { handlers: [respondOk("post", DECLINE, null)] } },
} satisfies Meta<typeof DeclineBookingDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const openInDocs = { docs: { story: { inline: false, iframeHeight: 460 } } };
const body = () => within(document.body);

/** Closed: a quiet *Decline* next to *Accept*; its name carries the mentee and the time. */
export const Playground: Story = {};

/** Open: the refund is stated, the reason is optional, focus is on the first control. */
export const Open: Story = {
  args: { defaultOpen: true },
  parameters: openInDocs,
  play: async () => {
    await expect(await body().findByRole("dialog", { name: "Decline the booking from Ola Wiśniewska?" })).toBeInTheDocument();
    await expect(body().getByText("The mentee gets a full refund and the slot is released.")).toBeInTheDocument();
  },
};

/** A reason of up to 280 characters; the count is in the hint. */
export const WithReason: Story = {
  args: { defaultOpen: true },
  parameters: openInDocs,
  play: async () => {
    await userEvent.type(await body().findByLabelText(/Reason for the mentee/), "I am on leave that week – please pick a later time.");
    await expect(body().getByText(/\(51 used\)/)).toBeInTheDocument();
  },
};

/** Over 280 characters: the button is disabled and the field says by how much. */
export const ReasonTooLong: Story = {
  args: { defaultOpen: true },
  parameters: openInDocs,
  play: async () => {
    fireEvent.change(await body().findByLabelText(/Reason for the mentee/), { target: { value: "x".repeat(300) } });
    await expect(body().getByRole("alert")).toHaveTextContent("Shorten the reason by 20 characters.");
    await expect(body().getByRole("button", { name: "Decline booking" })).toBeDisabled();
  },
};

/** The request is pending: nothing can be changed or dismissed. */
export const Declining: Story = {
  args: { defaultOpen: true },
  parameters: { ...openInDocs, msw: { handlers: [respondNever("post", DECLINE)] } },
  play: async () => {
    await userEvent.click(await body().findByRole("button", { name: "Decline booking" }));
    await expect(await body().findByRole("button", { name: "Declining…" })).toBeDisabled();
  },
};

/** The booking was accepted meanwhile (two tabs): refused in the dialog, in words. */
export const AlreadyDecided: Story = {
  args: { defaultOpen: true },
  parameters: { ...openInDocs, msw: { handlers: [respondError("post", DECLINE, { status: 409, code: "conflict", message: "This booking was already accepted." })] } },
  play: async () => {
    await userEvent.click(await body().findByRole("button", { name: "Decline booking" }));
    await expect(await body().findByRole("alert")).toHaveTextContent("This booking was already accepted.");
  },
};

/** *Keep booking* closes without a request. */
export const Keep: Story = {
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: /^Decline Ola/ }));
    await userEvent.click(await body().findByRole("button", { name: "Keep booking" }));
    await waitFor(() => expect(body().queryByRole("dialog")).not.toBeInTheDocument());
  },
};

export const Narrow: Story = { args: { defaultOpen: true }, parameters: openInDocs, globals: { viewport: { value: "mobile320", isRotated: false } } };
