import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { InvitationStatusBadge } from "../../../src/components/mentors/InvitationStatusBadge";

const meta = {
  title: "Product/E01/InvitationStatusBadge",
  component: InvitationStatusBadge,
  args: { status: "pending" },
  argTypes: { status: { control: "inline-radio", options: ["pending", "used", "expired", "revoked"] } },
} satisfies Meta<typeof InvitationStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The four statuses of a mentor invitation (spec E01: pending / used / expired / revoked – Q6). */
export const Statuses: Story = {
  render: () => (
    <div className="flex items-center gap-in-group">
      <InvitationStatusBadge status="pending" />
      <InvitationStatusBadge status="used" />
      <InvitationStatusBadge status="expired" />
      <InvitationStatusBadge status="revoked" />
    </div>
  ),
};

/** In a narrow table cell the badge never wraps or truncates – the words are short. */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <p className="type-body">
      kasia.lewandowska@example.com <InvitationStatusBadge status="pending" />
    </p>
  ),
};

/** The status is a word, not only a colour (WCAG 1.4.1). */
export const ReadAsText: Story = {
  render: () => <InvitationStatusBadge status="expired" />,
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Expired")).toBeVisible();
  },
};
