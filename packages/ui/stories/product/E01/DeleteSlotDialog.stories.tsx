import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../src/backend/api/apiCall";
import { DeleteSlotDialog } from "../../../src/components/availability/DeleteSlotDialog";
import { respondError, respondNever, respondOk } from "../../mocks/api";
import { timeZone } from "../../mocks/fixtures";

const slot = { id: "o2", startsAt: "2026-10-22T16:00:00Z", status: "open" as const, bookable: true };
const SLOT = `/api/mentor/slots/${slot.id}`;

const meta = {
  title: "Product/E01/DeleteSlotDialog",
  component: DeleteSlotDialog,
  args: { slot, timeZone, onConfirm: (target) => apiCall(`/api/mentor/slots/${target.id}`, { method: "DELETE" }) },
  argTypes: { onConfirm: { table: { disable: true } }, onDeleted: { table: { disable: true } }, slot: { control: "object" } },
  parameters: { a11y: { context: "body" }, msw: { handlers: [respondOk("delete", SLOT, null)] } },
} satisfies Meta<typeof DeleteSlotDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const openInDocs = { docs: { story: { inline: false, iframeHeight: 360 } } };
const body = () => within(document.body);

/** Closed: a quiet *Delete* in the row; its name carries the time, because rows repeat. */
export const Playground: Story = {};

/** Open: the question names the object and the time; focus is on *Keep slot*, the safe choice. */
export const Open: Story = {
  args: { defaultOpen: true },
  parameters: openInDocs,
  play: async () => {
    await expect(await body().findByRole("alertdialog", { name: "Delete the slot on Thu 22 Oct, 18:00?" })).toBeInTheDocument();
    await waitFor(() => expect(body().getByRole("button", { name: "Keep slot" })).toHaveFocus());
  },
};

/** The request is pending: both buttons are disabled and the dialog cannot be dismissed. */
export const Deleting: Story = {
  args: { defaultOpen: true },
  parameters: { ...openInDocs, msw: { handlers: [respondNever("delete", SLOT)] } },
  play: async () => {
    await userEvent.click(await body().findByRole("button", { name: "Delete slot" }));
    await expect(await body().findByRole("button", { name: "Deleting…" })).toBeDisabled();
    await expect(body().getByRole("button", { name: "Keep slot" })).toBeDisabled();
  },
};

/** The slot was booked while the page was open: refused in the dialog, with what to do instead. */
export const ErrorBooked: Story = {
  args: { defaultOpen: true },
  parameters: { ...openInDocs, msw: { handlers: [respondError("delete", SLOT, { status: 409, code: "conflict", message: "This slot is booked. Cancel the booking instead." })] } },
  play: async () => {
    await userEvent.click(await body().findByRole("button", { name: "Delete slot" }));
    await expect(await body().findByRole("alert")).toHaveTextContent("Cancel the booking instead.");
    await expect(body().getByRole("alertdialog")).toBeInTheDocument();
  },
};

/** *Keep slot* closes without a request. */
export const Keep: Story = {
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Delete the slot on Thu 22 Oct, 18:00" }));
    await userEvent.click(await body().findByRole("button", { name: "Keep slot" }));
    await waitFor(() => expect(body().queryByRole("alertdialog")).not.toBeInTheDocument());
  },
};

/** Confirmed: the server answers 200, the dialog closes and the page is told (the row leaves the list). */
export const Done: Story = {
  play: async () => {
    await userEvent.click(body().getByRole("button", { name: "Delete the slot on Thu 22 Oct, 18:00" }));
    await userEvent.click(await body().findByRole("button", { name: "Delete slot" }));
    await waitFor(() => expect(body().queryByRole("alertdialog")).not.toBeInTheDocument());
  },
};

/** At 320 px the buttons stack with the destructive action on top. */
export const Narrow: Story = { args: { defaultOpen: true }, parameters: openInDocs, globals: { viewport: { value: "mobile320", isRotated: false } } };
