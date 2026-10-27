import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { SessionNotePanel } from "../../../src/components/sessions/SessionNotePanel";

const meta = {
  title: "Product/E03/SessionNotePanel",
  component: SessionNotePanel,
  args: {
    bookingId: "b1",
    mentorName: "Marek Zieliński",
    note: { status: "draft", body: "Read the RFC on partial indexes before the next session. Your schema is fine." },
  },
} satisfies Meta<typeof SessionNotePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A draft the mentee decides on: shown in full, Approve and Reject. */
export const Draft: Story = {};

/** Approved: the note stays visible, no actions. */
export const Approved: Story = {
  args: { note: { status: "approved", body: "Ship the smaller change first." } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button", { name: "Approve" })).toBeNull();
  },
};
