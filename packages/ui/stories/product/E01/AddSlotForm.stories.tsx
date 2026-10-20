import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../src/backend/api/apiCall";
import { AddSlotForm } from "../../../src/components/availability/AddSlotForm";
import { respondError, respondNetworkError, respondNever, respondOk } from "../../mocks/api";
import { timeZone } from "../../mocks/fixtures";

const SLOTS = "/api/mentor/slots";
type Slot = { id: string; startsAt: string; status: "open" | "booked"; bookable: boolean };
const created = { id: "n1", startsAt: "2026-11-04T17:00:00.000Z", status: "open", bookable: true };

const meta = {
  title: "Product/E01/AddSlotForm",
  component: AddSlotForm,
  args: { timeZone, onSubmit: (startsAt) => apiCall<Slot>(SLOTS, { method: "POST", body: { startsAt } }) },
  argTypes: { onSubmit: { table: { disable: true } }, onAdded: { table: { disable: true } } },
  parameters: { msw: { handlers: [respondOk("post", SLOTS, created, 201)] } },
} satisfies Meta<typeof AddSlotForm>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;

function fill(canvas: Canvas, date = "2026-11-04", time = "18:00") {
  fireEvent.change(canvas.getByLabelText("Date"), { target: { value: date } });
  fireEvent.change(canvas.getByLabelText("Time"), { target: { value: time } });
}

const add = (canvas: Canvas) => userEvent.click(canvas.getByRole("button", { name: "Add slot" }));

export const Playground: Story = {};

/** *Add slot* with nothing chosen asks for a date and time, and puts focus on the date. */
export const NothingChosen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await add(canvas);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Choose a date and a time for the slot.");
    await expect(canvas.getByLabelText("Date")).toHaveFocus();
  },
};

/** Saved only after the server confirms: the fields clear, "Slot added." is announced, focus returns to the date. */
export const Added: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas);
    await add(canvas);
    await expect(await canvas.findByText("Slot added.")).toBeInTheDocument();
    await expect(canvas.getByLabelText("Date")).toHaveValue("");
    await waitFor(() => expect(canvas.getByLabelText("Date")).toHaveFocus());
  },
};

/** The request is pending: the button is busy and a second submit is ignored. */
export const Submitting: Story = {
  parameters: { msw: { handlers: [respondNever("post", SLOTS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas);
    await add(canvas);
    await expect(await canvas.findByRole("button", { name: "Adding…" })).toBeDisabled();
  },
};

/** A time the clocks skip is refused before anything is sent. */
export const NonexistentTime: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas, "2026-03-29", "02:30");
    await add(canvas);
    await expect(canvas.getByRole("alert")).toHaveTextContent("This time does not exist in your time zone");
  },
};

/** A time that happens twice is accepted: the preview shows which one is saved. */
export const AmbiguousTime: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas, "2026-10-25", "02:30");
    await expect(canvas.getByText(/happens twice/)).toBeInTheDocument();
  },
};

/** The server refuses (24-hour lead): its message appears at the field, the values stay. */
export const TooSoon: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("post", SLOTS, {
          status: 422,
          code: "validation_error",
          message: "Invalid input",
          fieldErrors: { startsAt: ["Slots must start at least 24 hours from now."] },
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas);
    await add(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("at least 24 hours from now");
    await expect(canvas.getByLabelText("Time")).toHaveValue("18:00");
  },
};

/** Another slot starts within 50 minutes (spacing): the same field error with the server's wording. */
export const SpacingRule: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("post", SLOTS, {
          status: 422,
          code: "validation_error",
          message: "Invalid input",
          fieldErrors: { startsAt: ["Slots must be at least 50 minutes apart."] },
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas);
    await add(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("50 minutes apart");
  },
};

/** The same start exists already (`conflict`): explained above the form, values kept. */
export const Duplicate: Story = {
  parameters: { msw: { handlers: [respondError("post", SLOTS, { status: 409, code: "conflict", message: "You already have a slot at this time." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas);
    await add(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("You already have a slot at this time.");
  },
};

/** No connection: explained in words; nothing is lost. */
export const NetworkError: Story = {
  parameters: { msw: { handlers: [respondNetworkError("post", SLOTS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fill(canvas);
    await add(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("No connection");
    await expect(canvas.getByLabelText("Date")).toHaveValue("2026-11-04");
  },
};

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
