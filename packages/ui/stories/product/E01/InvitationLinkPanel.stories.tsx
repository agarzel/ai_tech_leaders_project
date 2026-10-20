import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { InvitationLinkPanel } from "../../../src/components/mentors/InvitationLinkPanel";
import { newInvitation, timeZone } from "../../mocks/fixtures";

const meta = {
  title: "Product/E01/InvitationLinkPanel",
  component: InvitationLinkPanel,
  args: {
    email: newInvitation.invitation.email,
    link: newInvitation.link,
    expiresAt: newInvitation.invitation.expiresAt,
    timeZone,
    onDone: fn(),
  },
} satisfies Meta<typeof InvitationLinkPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Right after *Send invitation*: the link, its expiry and *Done*. Focus moves to the link. */
export const Playground: Story = {};

/** The same moment for an admin in another zone: the expiry is shown in the viewer's time zone. */
export const OtherTimeZone: Story = { args: { timeZone: "America/New_York" } };

/** A long address wraps in the title; the long link scrolls inside the field at 320 px. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { email: "aleksandra.konstantynopolitanczykiewiczowna@platform-engineering.example.com" },
};

/** Data states: loading, empty, error and partial do not apply – the panel exists only after the server returned the link (C3). */
export const NotApplicableStates: Story = {
  render: () => (
    <p className="max-w-prose type-body text-muted-foreground">
      The panel appears only with a link from a successful <code className="type-code">POST /api/admin/invitations</code>. Waiting and
      errors belong to the invitation form (pattern Form); the list shows loading, empty and error states.
    </p>
  ),
};

/** *Done* removes the link for good – it cannot be shown again (spec E01: the token is never stored). */
export const Dismiss: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(true);
    return open ? (
      <InvitationLinkPanel {...args} onDone={() => setOpen(false)} />
    ) : (
      <p role="status" className="type-body">
        Invitation sent to {args.email}. The link is no longer shown.
      </p>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByLabelText("Invitation link")).toHaveFocus();
    await userEvent.click(canvas.getByRole("button", { name: "Done" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("The link is no longer shown.");
    await expect(canvas.queryByLabelText("Invitation link")).not.toBeInTheDocument();
  },
};
