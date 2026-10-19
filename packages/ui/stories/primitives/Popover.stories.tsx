import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../../src/components/ui/popover";
import { Button } from "../../src/components/ui/button";

/** Why a time looks different to the mentor and the mentee (mentor-accounts spec: zones and DST). */
function TimeZoneInfo({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <Popover defaultOpen={defaultOpen}>
      <PopoverTrigger render={<Button variant="link" />}>Why this time?</PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Shown in your time zone</PopoverTitle>
          <PopoverDescription>
            Europe/Warsaw (CET). The mentor may see a different clock time for the same slot.{" "}
            <a href="#zones">How times are shown</a>
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

const meta = {
  title: "Primitives/Popover",
  component: TimeZoneInfo,
  parameters: { a11y: { context: "body" } },
} satisfies Meta<typeof TimeZoneInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

const openInDocs = { docs: { story: { inline: false, iframeHeight: 240 } } };

export const Playground: Story = {};

/** Open: a small panel next to its trigger, with a link inside. */
export const Open: Story = { args: { defaultOpen: true }, parameters: openInDocs };

/** At 320 px the panel narrows to the available width. */
export const Narrow: Story = {
  args: { defaultOpen: true },
  globals: { viewport: { value: "mobile320", isRotated: false } },
  parameters: openInDocs,
};

/** Enter opens, Tab reaches the link inside, Escape closes and focus returns to the trigger. */
export const KeyboardAndFocusReturn: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Why this time?" });

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const panel = await page.findByRole("dialog", { name: "Shown in your time zone" });
    await waitFor(() => expect(panel).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement));

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};
