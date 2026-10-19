import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy } from "lucide-react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Tooltip, TooltipContent, TooltipTrigger } from "../../src/components/ui/tooltip";
import { Button } from "../../src/components/ui/button";
import { Kbd } from "../../src/components/ui/kbd";

/** The name of an icon-only button, repeated visually (Icons page rule, WCAG 2.5.3). */
function CopyButton({ defaultOpen = false, label = "Copy share link" }: { defaultOpen?: boolean; label?: string }) {
  return (
    <Tooltip defaultOpen={defaultOpen}>
      <TooltipTrigger render={<Button variant="outline" size="icon" aria-label={label} />}>
        <Copy />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const meta = {
  title: "Primitives/Tooltip",
  component: CopyButton,
  parameters: { a11y: { context: "body" } },
  decorators: [(Story) => <div className="pt-section">{Story()}</div>],
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const openInDocs = { docs: { story: { inline: false, iframeHeight: 140 } } };

export const Playground: Story = {};

/** Open: one short line, optionally with the key. */
export const Open: Story = { args: { defaultOpen: true }, parameters: openInDocs };

export const WithShortcut: Story = {
  render: () => (
    <Tooltip defaultOpen>
      <TooltipTrigger render={<Button variant="outline">Send</Button>} />
      <TooltipContent>
        Send message <Kbd>Enter</Kbd>
      </TooltipContent>
    </Tooltip>
  ),
  parameters: openInDocs,
};

/** At 320 px a long label wraps inside max-w-xs; it should not be this long. */
export const LongNarrow: Story = {
  args: { defaultOpen: true, label: "Copy the share link to your offer, so you can paste it into a meetup chat" },
  globals: { viewport: { value: "mobile320", isRotated: false } },
  parameters: openInDocs,
};

/** Keyboard focus shows the tooltip, Escape hides it and focus stays on the button. */
export const ShowsOnFocus: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const button = within(canvasElement).getByRole("button", { name: "Copy share link" });

    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(page.getByText("Copy share link", { selector: "[data-slot=tooltip-content]" })).toBeVisible());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByText("Copy share link", { selector: "[data-slot=tooltip-content]" })).not.toBeInTheDocument());
    await expect(button).toHaveFocus();
  },
};
