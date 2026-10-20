import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { ActiveFilters, type ActiveFilter } from "../../src/backend/filters/ActiveFilters";

const meta = {
  title: "Primitives/Panel blocks/ActiveFilters",
  component: ActiveFilters,
  args: { filters: [{ key: "tag", label: "Stack: React" }], onRemove: fn(), onClearAll: fn(), label: "Active filters" },
  argTypes: { filters: { control: "object" } },
} satisfies Meta<typeof ActiveFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Several filters: each is its own button; *Clear filters* drops all of them. */
export const Several: Story = {
  args: {
    filters: [
      { key: "tag", label: "Stack: React" },
      { key: "status", label: "Status: Confirmed" },
      { key: "from", label: "From: 1 Nov" },
    ],
  },
};

/** No filter, nothing rendered – the list above stays quiet. */
export const None: Story = { args: { filters: [] } };

/** A long filter label wraps inside its button instead of pushing the row wide; at 320 px the buttons wrap. */
export const LongLabelNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { filters: [{ key: "tag", label: "Stack: AI agents with tool calling and evaluation" }, { key: "status", label: "Status: Awaiting acceptance" }] },
};

/** Removing a filter takes it away; *Clear filters* removes the rest. */
export const Removing: Story = {
  render: function Render(args) {
    const [filters, setFilters] = useState<ActiveFilter[]>([
      { key: "tag", label: "Stack: React" },
      { key: "status", label: "Status: Confirmed" },
    ]);
    return (
      <ActiveFilters
        {...args}
        filters={filters}
        onRemove={(key) => setFilters((current) => current.filter((filter) => filter.key !== key))}
        onClearAll={() => setFilters([])}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Remove filter: Stack: React" }));
    await expect(canvas.queryByRole("button", { name: "Remove filter: Stack: React" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(canvas.queryByRole("group")).not.toBeInTheDocument();
  },
};
