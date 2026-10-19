import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { ErrorMessage } from "../../src/backend/feedback/ErrorMessage";

type Args = { title: string; code: string; message: string; withRetry: boolean; onRetry: () => void };

const meta = {
  title: "Primitives/Panel blocks/ErrorMessage",
  args: {
    title: "Could not book",
    code: "conflict",
    message: "This time was just taken. Pick another time.",
    withRetry: false,
    onRetry: fn(),
  },
  argTypes: {
    code: { control: "select", options: ["conflict", "not_found", "rate_limited", "network_error", "invalid_response", "internal_error"] },
    onRetry: { table: { disable: true } },
  },
  render: ({ title, code, message, withRetry, onRetry }) => (
    <ErrorMessage title={title} error={{ code, message }} onRetry={withRetry ? onRetry : undefined} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Change `code` to see which messages are replaced (technical codes) and which are kept (domain codes). */
export const Playground: Story = {};

/** Domain error (server message kept), technical error (explained), plain text written by the caller. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-between-groups">
      <ErrorMessage title="Could not book" error={{ code: "conflict", message: "This time was just taken. Pick another time." }} />
      <ErrorMessage error={{ code: "network_error", message: "Could not reach the server. Check your connection." }} />
      <ErrorMessage error={{ code: "internal_error", message: "Internal server error" }} />
      <ErrorMessage title="Payment could not start" message="Card payments are unavailable right now. Nothing was charged. Try again in a few minutes." />
    </div>
  ),
};

/** Long messages wrap at 320 px; the retry button moves under the text. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: {
    title: "Could not load your bookings",
    code: "rate_limited",
    message: "Too many requests from this network in a short time. Wait a minute, then try again – your bookings are safe.",
    withRetry: true,
  },
};

/** *Try again* repeats the failed request. */
export const Retry: Story = {
  args: { code: "network_error", withRetry: true, title: "Could not load the list" },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("No connection");
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};
