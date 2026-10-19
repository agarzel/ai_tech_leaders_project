import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { EmptyState } from "../../src/backend/feedback/EmptyState";
import { Button } from "../../src/components/ui/button";

type Args = { title: string; description: string; withAction: boolean; onAction: () => void };

const meta = {
  title: "Primitives/Panel blocks/EmptyState",
  args: {
    title: "No slots yet",
    description: "Mentees can book you only at times you publish. Add a time at least 24 hours from now.",
    withAction: true,
    onAction: fn(),
  },
  argTypes: { onAction: { table: { disable: true } } },
  render: ({ title, description, withAction, onAction }) => (
    <EmptyState title={title} description={description || undefined} action={withAction ? <Button onClick={onAction}>Add slot</Button> : undefined} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A mentor's slot list before the first slot (spec E01, `/mentor/slots`; D13). */
export const Playground: Story = {};

/** Title only, title + reason, title + reason + next step. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-section">
      <EmptyState title="No invitations yet" />
      <EmptyState title="No times available right now" description="This mentor has no bookable times at the moment. Check this page again later." />
      <EmptyState
        title="No bookings yet"
        description="When you book a mentor, the booking and its status appear here."
        action={<Button variant="outline">Find a mentor</Button>}
      />
    </div>
  ),
};

/** Long text wraps at 320 px and stays readable (max one column of text). */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: {
    title: "No mentors match TypeScript and AI agents together",
    description:
      "Mentors who opted in to the public list are shown here when they have prices and at least one time you can book. Remove a filter to see more of them.",
  },
};

/** The next step is a real button. */
export const ActionClick: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Add slot" }));
    await expect(args.onAction).toHaveBeenCalled();
  },
};
