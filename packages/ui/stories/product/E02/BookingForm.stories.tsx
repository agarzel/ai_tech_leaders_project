import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../src/backend/api/apiCall";
import { BookingForm, type BookingStarted } from "../../../src/components/bookings/BookingForm";
import { respondError, respondNetworkError, respondNever, respondOk } from "../../mocks/api";
import { bookingSummary, startedBooking } from "../../mocks/fixtures";

const BOOKINGS = "/api/bookings";

const meta = {
  title: "Product/E02/BookingForm",
  component: BookingForm,
  args: {
    summary: bookingSummary,
    onStarted: fn(),
    onSubmit: ({ question }) => apiCall<BookingStarted>(BOOKINGS, { method: "POST", body: { slotId: "s2", lengthMinutes: 25, question, entryPoint: "link" } }),
  },
  argTypes: { onSubmit: { table: { disable: true } }, onStarted: { table: { disable: true } }, summary: { control: "object" } },
  parameters: { msw: { handlers: [respondOk("post", BOOKINGS, startedBooking, 201)] } },
} satisfies Meta<typeof BookingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
const ask = (canvas: Canvas, text = "Why does my canary rollout hang at 20%?") => userEvent.type(canvas.getByLabelText("Your question"), text);
const pay = (canvas: Canvas) => userEvent.click(canvas.getByRole("button", { name: /^Pay / }));

/** Summary, question, what happens next, *Pay PLN 180.00* – the one accent on the page. */
export const Playground: Story = {};

/** 50 minutes: the price on the button follows the summary. */
export const FiftyMinutes: Story = { args: { summary: { ...bookingSummary, lengthMinutes: 50, priceAmount: 32000 } } };

/** *Pay* with no question: asked for in words, focus on the field, nothing sent. */
export const QuestionRequired: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await pay(canvas);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Write your question for the mentor.");
    await waitFor(() => expect(canvas.getByLabelText("Your question")).toHaveFocus());
  },
};

/** The server accepts: the button stays busy ("Opening payment…") while the browser leaves for the payment page. */
export const RedirectingToCheckout: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("button", { name: "Opening payment…" })).toBeDisabled();
    await waitFor(() => expect(args.onStarted).toHaveBeenCalledWith(startedBooking));
    await expect(canvas.getByText("Taking you to the payment page.")).toBeInTheDocument();
  },
};

/** The request is pending: one submit at a time. */
export const Submitting: Story = {
  parameters: { msw: { handlers: [respondNever("post", BOOKINGS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("button", { name: "Booking…" })).toBeDisabled();
    await expect(canvas.getByLabelText("Your question")).toBeDisabled();
  },
};

/** Someone else booked the slot first (`conflict`): the question stays, the reason is explained. */
export const SlotTaken: Story = {
  parameters: { msw: { handlers: [respondError("post", BOOKINGS, { status: 409, code: "conflict", message: "This time was just taken. Choose another time." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, "My question");
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("This time was just taken.");
    await expect(canvas.getByLabelText("Your question")).toHaveValue("My question");
  },
};

/** Two unpaid bookings already (hoarding limit): says what to do first. */
export const TooManyUnpaid: Story = {
  parameters: { msw: { handlers: [respondError("post", BOOKINGS, { status: 409, code: "conflict", message: "Finish or abandon your previous payment first." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Finish or abandon your previous payment first.");
  },
};

/** The payment provider is unavailable (503 `payment_unavailable`): nothing was charged, try again. */
export const PaymentUnavailable: Story = {
  parameters: { msw: { handlers: [respondError("post", BOOKINGS, { status: 503, code: "payment_unavailable", message: "Payments are not available right now. You were not charged. Try again in a moment." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("You were not charged.");
    await expect(canvas.getByRole("button", { name: "Pay PLN\u00a0180.00" })).toBeEnabled();
  },
};

/** No connection: explained; the question is kept. */
export const NetworkError: Story = {
  parameters: { msw: { handlers: [respondNetworkError("post", BOOKINGS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas, "Keep me");
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("No connection");
    await expect(canvas.getByLabelText("Your question")).toHaveValue("Keep me");
  },
};

/** The server rejects the question itself (field error): shown at the field. */
export const FieldErrorFromServer: Story = {
  parameters: {
    msw: {
      handlers: [respondError("post", BOOKINGS, { status: 422, code: "validation_error", message: "Invalid input", fieldErrors: { question: ["The question must be 2,000 characters or fewer."] } })],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("2,000 characters or fewer");
    await waitFor(() => expect(canvas.getByLabelText("Your question")).toHaveFocus());
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
