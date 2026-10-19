import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../src/components/ui/dropdown-menu";
import { Button } from "../../src/components/ui/button";

type MenuArgs = { defaultOpen?: boolean; onEdit?: () => void; onDelete?: () => void; previews?: boolean };

/** Row actions of a slot (`/mentor/slots`): edit, copy the share link, delete. */
function SlotActions({ defaultOpen = false, onEdit, onDelete, previews = false }: MenuArgs) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions for the slot Tue 3 Nov, 18:00" />}>
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tue 3 Nov, 18:00 CET</DropdownMenuLabel>
          <DropdownMenuItem onClick={onEdit}>
            <Pencil aria-hidden="true" />
            Change time
          </DropdownMenuItem>
          <DropdownMenuItem data-preview-state={previews ? "focus" : undefined}>
            <Copy aria-hidden="true" />
            Copy share link
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Move to another day</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
          Delete slot
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const meta = {
  title: "Primitives/DropdownMenu",
  component: SlotActions,
  args: { onEdit: fn(), onDelete: fn() },
  parameters: { a11y: { context: "body" } },
} satisfies Meta<typeof SlotActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const openInDocs = { docs: { story: { inline: false, iframeHeight: 260 } } };

export const Playground: Story = {};

/** Open menu; item states: default, highlighted (frozen preview on "Copy share link"), disabled, destructive. */
export const States: Story = { args: { defaultOpen: true, previews: true }, parameters: openInDocs };

/** At 320 px the menu stays inside the viewport (collision handling). */
export const Narrow: Story = {
  args: { defaultOpen: true },
  globals: { viewport: { value: "mobile320", isRotated: false } },
  parameters: openInDocs,
};

/** Enter opens, arrows move, Enter runs, Escape closes and focus returns to the trigger. */
export const KeyboardAndFocusReturn: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole("button", { name: /Actions for the slot/ });

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await page.findByRole("menu");
    await waitFor(() => expect(within(menu).getByRole("menuitem", { name: "Change time" })).toHaveFocus());

    await userEvent.keyboard("{ArrowDown}");
    await expect(within(menu).getByRole("menuitem", { name: "Copy share link" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());

    await userEvent.click(trigger);
    await userEvent.click(within(await page.findByRole("menu")).getByRole("menuitem", { name: "Delete slot" }));
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(page.queryByRole("menu")).not.toBeInTheDocument());
    await expect(args.onEdit).not.toHaveBeenCalled();
  },
};
