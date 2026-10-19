import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "../../src/components/ui/skeleton";

const meta = {
  title: "Primitives/Skeleton",
  component: Skeleton,
  args: { className: "h-4 w-40" },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A row placeholder: keeps the exact shape of the dense list row it replaces (R01.1). */
export const ListRowShape: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col divide-y divide-border overflow-hidden rounded-lg border border-border">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-in-group px-list-row py-list-row">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  ),
};

/** A card placeholder: title, two lines, one action – the shape of a mentor checklist panel. */
export const CardShape: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-between-groups rounded-lg border border-border bg-card p-panel">
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-in-group">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-control w-28" />
    </div>
  ),
};

/** Skeleton has one look: it replaces content, it is never clicked, focused or coloured by state. */
export const States: Story = {
  render: () => (
    <div className="flex items-center gap-in-group">
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="h-4 w-40" />
    </div>
  ),
};

/** At 320 px the placeholder shrinks with its container instead of overflowing. */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="flex w-full max-w-xs flex-col gap-in-group">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
};
