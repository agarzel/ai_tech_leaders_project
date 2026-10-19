import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../src/components/ui/alert-dialog";
import { Button } from "../../src/components/ui/button";

type ConfirmArgs = { defaultOpen?: boolean; slot?: string; onDelete?: () => void };

/** Delete confirmation (prompt stage 3): the object's name in the question, a verb on the button. */
function DeleteSlot({ defaultOpen = false, slot = "Tue 3 Nov, 18:00 CET", onDelete }: ConfirmArgs) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>Delete slot</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{`Delete the slot ${slot}?`}</AlertDialogTitle>
          <AlertDialogDescription>Mentees can no longer book this time. You can add it again later.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep slot</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            Delete slot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

const meta = {
  title: "Primitives/AlertDialog",
  component: DeleteSlot,
  args: { onDelete: fn() },
  parameters: { a11y: { context: "body" } },
} satisfies Meta<typeof DeleteSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

const openInDocs = { docs: { story: { inline: false, iframeHeight: 320 } } };

export const Playground: Story = {};

/** Open: Cancel first in the source and focused first; the destructive action names the object. */
export const Open: Story = { args: { defaultOpen: true }, parameters: openInDocs };

/** Long object names wrap; at 320 px the buttons stack with the action on top. */
export const LongNameNarrow: Story = {
  args: { defaultOpen: true, slot: "Wednesday 25 November 2026, 07:45 Europe/Warsaw (after the DST change)" },
  globals: { viewport: { value: "mobile320", isRotated: false } },
  parameters: openInDocs,
};

/** Opening focuses "Keep slot"; Escape cancels and returns focus; a backdrop click does not close it; the action runs only on purpose. */
export const KeyboardAndFocusReturn: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Delete slot" });

    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const dialog = await page.findByRole("alertdialog", { name: /Delete the slot/ });
    await waitFor(() => expect(within(dialog).getByRole("button", { name: "Keep slot" })).toHaveFocus());

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("alertdialog")).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(args.onDelete).not.toHaveBeenCalled();

    await userEvent.click(trigger);
    const reopened = await page.findByRole("alertdialog");
    const backdrop = canvasElement.ownerDocument.querySelector<HTMLElement>("[data-slot=alert-dialog-overlay]");
    if (backdrop) await userEvent.click(backdrop);
    await expect(reopened).toBeInTheDocument();
    await userEvent.click(within(reopened).getByRole("button", { name: "Delete slot" }));
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
  },
};
