import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Kbd, KbdGroup } from "../../src/components/ui/kbd";

const meta = {
  title: "Primitives/Kbd",
  component: Kbd,
  args: { children: "Enter" },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The session composer hint (R02.2): Enter sends, Shift+Enter adds a line. */
export const ComposerHint: Story = {
  render: () => (
    <p className="type-meta text-muted-foreground">
      <Kbd>Enter</Kbd> to send ·{" "}
      <KbdGroup>
        <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
      </KbdGroup>{" "}
      for a new line
    </p>
  ),
};

/** Kbd has one state: it is text, not a control (no hover, focus or disabled). */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-in-group">
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>Space</Kbd>
    </div>
  ),
};

/** Long key names wrap with the sentence at 320 px; keys never break inside. */
export const LongTextNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <p className="max-w-xs type-body text-muted-foreground">
      Press <Kbd>Enter</Kbd> to send your message to the mentor, or{" "}
      <KbdGroup>
        <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd>
      </KbdGroup>{" "}
      to start a new line, for example before pasting a YAML file.
    </p>
  ),
};

/** Keys are read as text inside the sentence and are not focusable. */
export const ReadAsText: Story = {
  render: () => (
    <p className="type-meta text-muted-foreground">
      <Kbd>Enter</Kbd> to send
    </p>
  ),
  play: async ({ canvasElement }) => {
    const key = within(canvasElement).getByText("Enter");
    await expect(key.tagName).toBe("KBD");
    await expect(key).not.toHaveAttribute("tabindex");
    await expect(key.closest("p")).toHaveTextContent("Enter to send");
  },
};
