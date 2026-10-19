import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Pagination } from "../../src/backend/tables/Pagination";

const meta = {
  title: "Primitives/Panel blocks/Pagination",
  component: Pagination,
  args: { page: 2, pageSize: 10, total: 34, isLoading: false, label: "Pagination", onPageChange: fn() },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** First, middle and last page: *Previous* / *Next* are disabled at the ends. */
export const States: Story = {
  render: (args) => (
    <div className="flex flex-col gap-section">
      <Pagination {...args} page={1} label="First page example" />
      <Pagination {...args} page={2} label="Middle page example" />
      <Pagination {...args} page={4} label="Last page example" />
      <Pagination {...args} page={2} isLoading label="Loading example" />
    </div>
  ),
};

/** Large totals keep their digits aligned (`tabular-nums`). */
export const LargeTotals: Story = { args: { page: 118, pageSize: 25, total: 2_941 } };

/** At 320 px the range and the buttons wrap onto two lines. */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { label: "Bookings pages" },
};

/** Clicking *Next* asks for the next page; the range follows. */
export const NextPage: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(1);
    return <Pagination {...args} page={page} onPageChange={setPage} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(canvas.getByRole("navigation", { name: "Pagination" })).toHaveTextContent("11–20 of 34");
    await expect(canvas.getByRole("button", { name: "Previous" })).toBeEnabled();
  },
};
