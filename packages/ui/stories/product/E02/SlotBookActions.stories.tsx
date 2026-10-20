import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { focusState, hoverState, StateMatrix } from "../../../.storybook/blocks/Docs";
import { SlotBookActions } from "../../../src/components/bookings/SlotBookActions";

const meta = {
  title: "Product/E02/SlotBookActions",
  component: SlotBookActions,
  args: {
    slotLabel: "Thu 22 Oct, 18:00",
    price25: 18000,
    price50: 32000,
    currency: "PLN",
    hrefFor: (length) => `/book/s2?length=${length}&from=list`,
  },
  argTypes: { hrefFor: { table: { disable: true } }, renderLink: { table: { disable: true } } },
} satisfies Meta<typeof SlotBookActions>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Both lengths, the price inside each button; neither is the accent (equal choices, Q3). */
export const Playground: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("link", { name: /^Book 25 min/ })).toHaveAttribute("href", "/book/s2?length=25&from=list");
    await expect(canvas.getByRole("link", { name: /^Book 50 min/ })).not.toHaveClass("bg-primary");
  },
};

/** A length without a price is not offered. */
export const OnePrice: Story = { args: { price25: null } };

/** No price at all: a sentence instead of buttons. */
export const NoPrice: Story = { args: { price25: null, price50: null } };

/** The mentor looks at their own page: booking one's own slot is forbidden, so no action. */
export const OwnSlot: Story = { args: { isOwnSlot: true } };

/** Large amounts keep their digits aligned and the code and amount on one line. */
export const LargeAmounts: Story = { args: { price25: 120000, price50: 1000000 } };

/** Hover and focus of the links (frozen previews). */
export const States: Story = {
  render: (args) => (
    <StateMatrix
      caption="Book action states"
      rows={["Book 25 min"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(_row, state) => <SlotBookActions {...args} price50={null} renderLink={(props) => <a {...props} {...state.props} />} />}
    />
  ),
};

/** At 320 px the two buttons wrap onto two lines. */
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
