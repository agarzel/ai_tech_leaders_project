import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { CopyField } from "../../src/backend/forms/CopyField";
import { newInvitation } from "../mocks/fixtures";

/** Replaces the clipboard for one interaction test and puts the browser's own back afterwards. */
async function withClipboard(writeText: (text: string) => Promise<void>, run: () => Promise<void>) {
  const original = Object.getOwnPropertyDescriptor(navigator, "clipboard");
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
  try {
    await run();
  } finally {
    if (original) Object.defineProperty(navigator, "clipboard", original);
    else delete (navigator as { clipboard?: unknown }).clipboard;
  }
}

const meta = {
  title: "Primitives/Panel blocks/CopyField",
  component: CopyField,
  args: {
    label: "Share link",
    value: "https://devmentor.example/m/marek-zielinski-k3x9q2",
    description: "Anyone with this link can see your profile and book your open times.",
    copyLabel: "Copy link",
    autoFocus: false,
  },
} satisfies Meta<typeof CopyField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A mentor's share link (spec E01, Phase 4). */
export const Playground: Story = {};

/** The two product uses: an invitation link (shown once) and a share link (always there). */
export const Uses: Story = {
  render: () => (
    <div className="flex max-w-lg flex-col gap-section">
      <CopyField label="Invitation link" value={newInvitation.link} description="Shown only once. Valid for 14 days." />
      <CopyField label="Share link" value="https://devmentor.example/m/marek-zielinski-k3x9q2" />
    </div>
  ),
};

/** A long link scrolls inside the field at 320 px; the button keeps its label. */
export const LongValueNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { label: "Invitation link", value: newInvitation.link, description: "Shown only once. Valid for 14 days." },
};

/** Copying confirms in words (polite status, no toast – S10). */
export const Copy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await withClipboard(
      async () => undefined,
      async () => {
        await userEvent.click(canvas.getByRole("button", { name: "Copy link" }));
        await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("Copied to the clipboard."));
      },
    );
  },
};

/** Clipboard refused (browser permission): the text is selected and the message says how to copy it by hand. */
export const ClipboardDenied: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await withClipboard(
      async () => Promise.reject(new DOMException("Denied", "NotAllowedError")),
      async () => {
        await userEvent.click(canvas.getByRole("button", { name: "Copy link" }));
        await waitFor(() => expect(canvas.getByRole("status")).toHaveTextContent("press Ctrl+C"));
      },
    );
  },
};
