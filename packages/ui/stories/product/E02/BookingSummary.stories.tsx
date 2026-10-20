import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookingSummary } from "../../../src/components/bookings/BookingSummary";
import { bookingSummary } from "../../mocks/fixtures";

const meta = {
  title: "Product/E02/BookingSummary",
  component: BookingSummary,
  args: bookingSummary,
} satisfies Meta<typeof BookingSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** 50 minutes, the higher price. */
export const FiftyMinutes: Story = { args: { lengthMinutes: 50, priceAmount: 32000 } };

/** The viewer is in another zone: the same instant, the zone named. */
export const OtherTimeZone: Story = { args: { timeZone: "Asia/Tokyo" } };

/** A very long mentor name wraps instead of widening the page. */
export const LongName: Story = { args: { mentorName: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska" } };

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { priceAmount: 1000000 } };
