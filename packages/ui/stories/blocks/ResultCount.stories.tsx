import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { ResultCount } from "../../src/backend/filters/ResultCount";

const meta = {
  title: "Primitives/Panel blocks/ResultCount",
  component: ResultCount,
  args: { total: 12, noun: "mentor" },
} satisfies Meta<typeof ResultCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("status")).toHaveTextContent("12 mentors");
  },
};

/** One result uses the singular. */
export const One: Story = { args: { total: 1 } };

/** No results: "0 mentors" – the empty state below explains what to do. */
export const Zero: Story = { args: { total: 0 } };

/** Irregular plural. */
export const IrregularPlural: Story = { args: { noun: "person", plural: "people", total: 3 } };

/** While the list reloads the count is empty, so an old number is never announced. */
export const Loading: Story = {
  args: { isLoading: true },
  render: (args) => (
    <div className="flex items-center gap-in-group type-meta text-muted-foreground">
      <span>Count while loading:</span>
      <ResultCount {...args} />
      <span>(empty)</span>
    </div>
  ),
};

/** Large totals keep their digits aligned. */
export const LargeTotal: Story = { args: { total: 12_480 } };
