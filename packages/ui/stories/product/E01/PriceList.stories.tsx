import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { PriceList, PriceListSkeleton } from "../../../src/components/mentors/PriceList";

const meta = {
  title: "Product/E01/PriceList",
  component: PriceList,
  args: { price25: 18000, price50: 32000, currency: "PLN" },
} satisfies Meta<typeof PriceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The mentor's own view before prices are set (partial). Public pages never show this – mentors without prices are not listed. */
export const NotSet: Story = { args: { price25: null, price50: null } };

/** One price set. */
export const Partial: Story = { args: { price50: null } };

/** The largest amounts the sanity bounds allow (spec E01: up to PLN 10,000) keep their digits aligned. */
export const LargeAmounts: Story = { args: { price25: 450050, price50: 1000000 } };

export const Loading: Story = { render: () => <PriceListSkeleton /> };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };

/** Length and amount are read as pairs (a description list). */
export const ReadAsPairs: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("term")).toHaveLength(2);
    await expect(canvas.getAllByRole("definition")[0]).toHaveTextContent(/PLN.180\.00/);
  },
};
