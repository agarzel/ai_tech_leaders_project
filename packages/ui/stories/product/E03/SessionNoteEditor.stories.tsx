import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { SessionNoteEditor } from "../../../src/components/sessions/SessionNoteEditor";

const meta = {
  title: "Product/E03/SessionNoteEditor",
  component: SessionNoteEditor,
  args: { bookingId: "b1", note: null, canWrite: true },
} satisfies Meta<typeof SessionNoteEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

/** After the session, nothing written yet: the editor is open. */
export const Write: Story = {};

/** A saved draft: the mentor can change it until the mentee decides. */
export const EditDraft: Story = {
  args: { note: { status: "draft", body: "Good questions. Next time, bring the failing query." } },
};

/** Before the session ends: nothing to write yet. */
export const BeforeSession: Story = {
  args: { canWrite: false },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("You can write a note after the session ends.")).toBeInTheDocument();
  },
};

/** Approved by the mentee: final, read-only. */
export const Approved: Story = {
  args: { note: { status: "approved", body: "Good questions." }, canWrite: false },
};

/** Rejected by the mentee: final, read-only, and the mentor is told it is not shown. */
export const Rejected: Story = {
  args: { note: { status: "rejected", body: "Not for them." }, canWrite: false },
};
