import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Separator } from "../../src/components/ui/separator";

const meta = {
  title: "Primitives/Separator",
  component: Separator,
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } },
  render: (args) => (
    <div className="flex h-16 max-w-sm flex-col justify-center gap-in-group">
      <Separator {...args} />
    </div>
  ),
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Horizontal between groups inside one panel; vertical between items of a toolbar line. */
export const Orientations: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-between-groups rounded-lg border border-border bg-card p-panel text-card-foreground">
      <div className="flex flex-col gap-in-group">
        <p className="type-label">Prices</p>
        <p className="type-meta text-muted-foreground">25 min · PLN 120.00 · 50 min · PLN 220.00</p>
      </div>
      <Separator />
      <div className="flex h-5 items-center gap-in-group type-meta text-muted-foreground">
        <span>3 bookable slots</span>
        <Separator orientation="vertical" />
        <span>Listed publicly</span>
      </div>
    </div>
  ),
};

/** A separator has no interactive states; it only follows the theme. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-in-group">
      <span className="type-meta text-muted-foreground">Horizontal (border token, decorative – T5)</span>
      <Separator />
    </div>
  ),
};

/** At 320 px it spans the panel width; it never adds space of its own (the parent gap does). */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="flex max-w-xs flex-col gap-between-groups">
      <p className="type-body">Your question was sent to the mentor.</p>
      <Separator />
      <p className="type-body">The mentor accepts or declines it until 12 hours before the session.</p>
    </div>
  ),
};

/** Exposed as a separator with its orientation; decorative separators can be hidden from screen readers. */
export const Semantics: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-in-group">
      <span>Slots</span>
      <Separator orientation="vertical" />
      <span>Bookings</span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole("separator");
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
  },
};
