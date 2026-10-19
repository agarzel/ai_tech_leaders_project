import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../src/components/ui/dialog";
import { Button } from "../../src/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../src/components/ui/field";
import { Textarea } from "../../src/components/ui/textarea";
import { Spinner } from "../../src/components/ui/spinner";

const longReason =
  "I have not run ingress-nginx 1.28 in production yet, only 1.11 on a single cluster, so I would be guessing about the restart loop. Someone who has done this exact upgrade on EKS will answer faster and more reliably than I can, and you should not pay for my guesses. Try a mentor with a public write-up of the migration.";

type DeclineArgs = { defaultOpen?: boolean; state?: "idle" | "submitting" | "error"; onDecline?: () => void };

/** DeclineBookingDialog in its primitive form: optional reason ≤ 280, the refund stated (booking spec). */
function DeclineDialog({ defaultOpen = false, state = "idle", onDecline }: DeclineArgs) {
  const submitting = state === "submitting";
  return (
    <Dialog defaultOpen={defaultOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>Decline booking</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decline the booking from Jan Nowak?</DialogTitle>
          <DialogDescription>The mentee gets a full refund and the slot is released.</DialogDescription>
        </DialogHeader>
        <Field data-invalid={state === "error" || undefined}>
          <FieldLabel htmlFor="decline-reason" optional>
            Reason for the mentee
          </FieldLabel>
          <Textarea
            id="decline-reason"
            maxLength={400}
            aria-invalid={state === "error" || undefined}
            aria-describedby={state === "error" ? "decline-reason-error" : "decline-reason-hint"}
            defaultValue={state === "error" ? longReason : undefined}
          />
          {state === "error" ? (
            <FieldError id="decline-reason-error">The reason is longer than 280 characters. Shorten it – the mentee sees it.</FieldError>
          ) : (
            <FieldDescription id="decline-reason-hint">Up to 280 characters. The mentee sees it.</FieldDescription>
          )}
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Keep booking</DialogClose>
          <Button variant="destructive" disabled={submitting} aria-busy={submitting || undefined} onClick={onDecline}>
            {submitting ? (
              <>
                <Spinner aria-hidden="true" data-icon="inline-start" />
                Declining…
              </>
            ) : (
              "Decline booking"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const meta = {
  title: "Primitives/Dialog",
  component: DeclineDialog,
  args: { onDecline: fn() },
  // The popup is portalled to <body>: check accessibility on the whole document.
  parameters: { a11y: { context: "body" } },
} satisfies Meta<typeof DeclineDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Closed: only the trigger. */
export const Playground: Story = {};

const openInDocs = { docs: { story: { inline: false, iframeHeight: 460 } } };

/** Open (rendered in its own frame in the docs, so it does not cover the page). */
export const Open: Story = { args: { defaultOpen: true }, parameters: openInDocs };

/** States of the content: idle, submitting (button busy), validation error. */
export const Submitting: Story = { args: { defaultOpen: true, state: "submitting" }, parameters: openInDocs };
export const WithError: Story = { args: { defaultOpen: true, state: "error" }, parameters: openInDocs };

/** At 320 px the dialog keeps a 16 px gutter and the buttons stack, main action on top. */
export const Narrow: Story = {
  args: { defaultOpen: true },
  globals: { viewport: { value: "mobile320", isRotated: false } },
  parameters: openInDocs,
};

/** A dialog with a long text scrolls inside the page, not inside itself. */
function LongDialog() {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How refunds work</DialogTitle>
          <DialogDescription>
            You pay when you book. The mentor accepts or declines your question until 12 hours before the session. If they
            decline, or do not answer in time, you get the full amount back to your card. Stripe sends the receipt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}
export const LongContent: Story = { render: () => <LongDialog />, parameters: openInDocs };

/** Click opens, focus moves inside, Tab stays inside, Escape closes, focus returns to the trigger. */
export const KeyboardAndFocusReturn: Story = {
  play: async ({ canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Decline booking" });

    await userEvent.click(trigger);
    const dialog = await page.findByRole("dialog", { name: "Decline the booking from Jan Nowak?" });
    await waitFor(() => expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement));
    await expect(dialog).toHaveAccessibleDescription(/full refund/);

    for (let i = 0; i < 6; i += 1) await userEvent.tab();
    await expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page.queryByRole("dialog", { name: /Decline the booking/ })).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/** The action runs; "Keep booking" closes without running it. */
export const ActionAndCancel: Story = {
  play: async ({ args, canvasElement }) => {
    const page = within(canvasElement.ownerDocument.body);
    const trigger = within(canvasElement).getByRole("button", { name: "Decline booking" });

    await userEvent.click(trigger);
    await userEvent.click(await page.findByRole("button", { name: "Keep booking" }));
    await waitFor(() => expect(page.queryByRole("dialog", { name: /Decline the booking/ })).not.toBeInTheDocument());
    await expect(args.onDecline).not.toHaveBeenCalled();

    await userEvent.click(trigger);
    const dialog = await page.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "Decline booking" }));
    await expect(args.onDecline).toHaveBeenCalledTimes(1);
  },
};
