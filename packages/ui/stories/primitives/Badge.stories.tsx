import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert } from "lucide-react";
import { expect, within } from "storybook/test";

import { Badge } from "../../src/components/ui/badge";
import { focusState, StateMatrix } from "../../.storybook/blocks/Docs";

const variants = ["secondary", "outline", "destructive", "default"] as const;

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  args: { children: "Awaiting mentor" },
  argTypes: { variant: { control: "inline-radio", options: variants } },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Booking statuses (booking spec). Statuses use secondary/outline/destructive, never default (T10). */
export const BookingStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-in-group">
      <Badge variant="outline">Awaiting payment</Badge>
      <Badge>Awaiting mentor</Badge>
      <Badge>Confirmed</Badge>
      <Badge variant="destructive">Declined</Badge>
      <Badge variant="outline">Expired</Badge>
      <Badge variant="outline">Payment expired</Badge>
    </div>
  ),
};

/** Variants; `default` (accent) only for the screen's one emphasised status (P5), and never as a list status (T10). */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-in-group">
      {variants.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
      <Badge variant="destructive">
        <CircleAlert data-icon="inline-start" aria-hidden="true" />
        Refund failed
      </Badge>
    </div>
  ),
};

/** A badge is static; as a link (`render={<a />}`) it gets hover and focus (frozen previews). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Badge as a link"
      rows={variants}
      states={[{ name: "Default", props: {} }, { name: "Hover", props: { "data-preview-state": "hover" } }, focusState]}
      render={(variant, state) => (
        <Badge variant={variant} render={<a href="#tag" />} {...state.props}>
          {`React (${variant}, ${state.name.toLowerCase()})`}
        </Badge>
      )}
    />
  ),
};

/** Badges never wrap; a long status is a sign the text should be shorter. At 320 px they wrap as a group. */
export const LongTextNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="flex max-w-xs flex-wrap gap-in-group">
      <Badge>TypeScript</Badge>
      <Badge>React</Badge>
      <Badge>Python</Badge>
      <Badge>AI agents</Badge>
      <Badge variant="outline">Not bookable – starts too soon</Badge>
    </div>
  ),
};

/** The status is text, so it is read out; colour is never the only cue (WCAG 1.4.1). */
export const ReadAsText: Story = {
  render: () => (
    <p>
      Booking for Tue 3 Nov: <Badge>Awaiting mentor</Badge>
    </p>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText(/Booking for Tue 3 Nov/).textContent).toContain("Awaiting mentor");
  },
};
