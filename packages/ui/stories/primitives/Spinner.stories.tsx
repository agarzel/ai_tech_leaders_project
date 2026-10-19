import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { Spinner } from "../../src/components/ui/spinner";
import { Button } from "../../src/components/ui/button";

const meta = {
  title: "Primitives/Spinner",
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Inside a button: replaces the leading icon while submitting (B18). */
export const InButton: Story = {
  render: () => (
    <Button disabled aria-busy="true">
      <Spinner aria-hidden="true" data-icon="inline-start" />
      Saving…
    </Button>
  ),
};

/** As a short, page-level status (`LoadingMessage`): the spinner is decorative, the text carries the status. */
export const ShortStatus: Story = {
  render: () => (
    <div role="status" className="flex items-center justify-center gap-2 py-section type-body text-muted-foreground">
      <Spinner role="presentation" aria-hidden="true" aria-label={undefined} />
      Loading…
    </div>
  ),
};

/** One state: spinning. Size follows the control it sits in (16 px default, 20 px standalone). */
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-section">
      <Spinner />
      <Spinner className="size-5" />
    </div>
  ),
};

/** At 320 px the spinner does not shrink below a legible size next to its label. */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Button className="w-full" disabled aria-busy="true">
      <Spinner aria-hidden="true" data-icon="inline-start" />
      Accepting…
    </Button>
  ),
};

/** The spinner announces "Loading" once; next to visible text it is hidden so the status is not read twice. */
export const AnnouncedOnce: Story = {
  play: async ({ canvasElement }) => {
    const spinner = within(canvasElement).getByRole("status");
    await expect(spinner).toHaveAccessibleName("Loading");
  },
};
