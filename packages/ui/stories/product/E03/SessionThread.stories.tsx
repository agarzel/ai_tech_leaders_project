import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { SessionThread, type ThreadMessage } from "../../../src/components/sessions/SessionThread";

const messages: ThreadMessage[] = [
  { id: "m1", authorId: "mentee", body: "The migration fails on the second run. What am I missing?", createdAt: "2026-11-04T17:04:00Z" },
  { id: "m2", authorId: "mentor", body: "Check the partial unique index first; it is written by hand.", createdAt: "2026-11-04T17:06:00Z" },
];

const meta = {
  title: "Product/E03/SessionThread",
  component: SessionThread,
  args: {
    bookingId: "b1",
    viewerId: "mentee",
    counterpartName: "Marek Zieliński",
    timeZone: "Europe/Warsaw",
    messages,
    canWrite: true,
  },
} satisfies Meta<typeof SessionThread>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inside the session window: the thread with the composer. */
export const Playground: Story = {};

/** Nothing sent yet: the empty line, then the composer. */
export const Empty: Story = { args: { messages: [] } };

/** After the session window: the messages stay readable, the composer is gone. */
export const ReadOnly: Story = {
  args: { canWrite: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByLabelText("Message")).toBeNull();
  },
};
