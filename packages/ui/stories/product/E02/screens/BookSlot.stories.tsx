import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, userEvent, within, waitFor } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { BookingForm, type BookingStarted } from "../../../../src/components/bookings/BookingForm";
import { respondError, respondNetworkError, respondNever, respondOk } from "../../../mocks/api";
import { bookingSummary, nav, signedIn, startedBooking } from "../../../mocks/fixtures";

const BOOKINGS = "/api/bookings";
const PRICES = { 25: 18000, 50: 32000 } as const;

/**
 * `/book/[slotId]?length=…` (spec E02, #30): the summary, the question and *Pay*. The page (app code)
 * reads the slot and the price on the server and renders this; an anonymous visitor is sent to
 * `/login?next=…` first and comes back. *Pay* creates the booking (`POST /api/bookings`, MSW answers)
 * and the browser leaves for the card payment page. `entryPoint` comes from `?from=` (link | list).
 */
function BookSlotScreen({ length = 25 }: { length?: 25 | 50 }) {
  return (
    <PageLayout
      header={<AppHeader nav={nav.mentee} account={<AccountMenu user={signedIn.mentee} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Book a session"
      description="Write your question, then pay by card. The time is yours while you pay."
    >
      <BookingForm
        summary={{ ...bookingSummary, lengthMinutes: length, priceAmount: PRICES[length] }}
        onSubmit={({ question }) =>
          apiCall<BookingStarted>(BOOKINGS, { method: "POST", body: { slotId: "s2", lengthMinutes: length, question, entryPoint: "link" } })
        }
      />
    </PageLayout>
  );
}

const meta = {
  title: "Product/E02/Screens/BookSlot",
  component: BookSlotScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [respondOk("post", BOOKINGS, startedBooking, 201)] } },
} satisfies Meta<typeof BookSlotScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

type Canvas = ReturnType<typeof within>;
const ask = (canvas: Canvas, text = "Why does my canary rollout hang at 20%?") => userEvent.type(canvas.getByLabelText("Your question"), text);
const pay = (canvas: Canvas) => userEvent.click(canvas.getByRole("button", { name: /^Pay / }));

/** 25 minutes: summary with the price, the question, the note on declining, *Pay PLN 180.00*. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 1, name: "Book a session" })).toBeInTheDocument();
    await expect(canvas.getByText("PLN 180.00")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Pay PLN 180.00" })).toBeInTheDocument();
  },
};

export const FiftyMinutes: Story = { args: { length: 50 } };

/** *Pay* with nothing written: asked for at the field, focus moves there. */
export const QuestionInvalid: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await pay(canvas);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Write your question for the mentor.");
    await waitFor(() => expect(canvas.getByLabelText("Your question")).toHaveFocus());
  },
};

/** A pasted question close to the 2,000-character limit: the characters left are announced. */
export const NearLimit: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.change(canvas.getByLabelText("Your question"), { target: { value: "x".repeat(1900) } });
    await expect(canvas.getByText("100 characters left")).toBeInTheDocument();
  },
};

export const Submitting: Story = {
  parameters: { msw: { handlers: [respondNever("post", BOOKINGS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("button", { name: "Booking…" })).toBeDisabled();
  },
};

/** The booking exists: *Opening payment…* until the browser leaves for the card payment page. */
export const RedirectingToCheckout: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("button", { name: "Opening payment…" })).toBeDisabled();
  },
};

/** Someone else got the slot first. */
export const SlotTaken: Story = {
  parameters: { msw: { handlers: [respondError("post", BOOKINGS, { status: 409, code: "conflict", message: "This time was just taken. Choose another time." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("This time was just taken.");
  },
};

export const TooManyUnpaid: Story = {
  parameters: { msw: { handlers: [respondError("post", BOOKINGS, { status: 409, code: "conflict", message: "Finish or abandon your previous payment first." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Finish or abandon your previous payment first.");
  },
};

export const PaymentUnavailable: Story = {
  parameters: { msw: { handlers: [respondError("post", BOOKINGS, { status: 503, code: "payment_unavailable", message: "Payments are not available right now. You were not charged. Try again in a moment." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("You were not charged.");
  },
};

export const NetworkError: Story = {
  parameters: { msw: { handlers: [respondNetworkError("post", BOOKINGS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await ask(canvas);
    await pay(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("No connection");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
