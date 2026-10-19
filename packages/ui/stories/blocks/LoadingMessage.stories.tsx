import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { LoadingMessage } from "../../src/backend/feedback/LoadingMessage";

const meta = {
  title: "Primitives/Panel blocks/LoadingMessage",
  component: LoadingMessage,
  args: { label: "Loading…" },
} satisfies Meta<typeof LoadingMessage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A label that names what is loading. */
export const CustomLabel: Story = { args: { label: "Loading invitations…" } };

/** Long labels wrap at 320 px next to the spinner. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { label: "Checking your payment with the card provider…" },
};

/** One live region: the label is announced once, the spinner is silent. */
export const AnnouncedOnce: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("status")).toHaveLength(1);
    await expect(canvas.getByRole("status")).toHaveTextContent("Loading…");
  },
};
