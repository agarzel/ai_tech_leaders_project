import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookingRow } from "../../../src/components/bookings/BookingRow";
import { ItemGroup } from "../../../src/components/ui/item";
import { bookings, menteeBookings, timeZone } from "../../mocks/fixtures";

const meta = {
  title: "Product/E02/BookingRow",
  component: BookingRow,
  args: { booking: bookings.waiting, href: "/bookings/b1", timeZone },
  argTypes: { booking: { control: "object" }, renderLink: { table: { disable: true } } },
  render: (args) => (
    <ItemGroup aria-label="Bookings">
      <BookingRow {...args} />
    </ItemGroup>
  ),
} satisfies Meta<typeof BookingRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every state of the machine, each with its status in words. */
export const AllStatuses: Story = {
  render: () => (
    <ItemGroup aria-label="Bookings">
      {menteeBookings.map((booking) => (
        <BookingRow key={booking.id} booking={booking} href={`/bookings/${booking.id}`} timeZone={timeZone} />
      ))}
    </ItemGroup>
  ),
};

/** A long mentor name is cut to one line (full name in `title`); the status wraps below at 320 px. */
export const LongName: Story = {
  args: { booking: { ...bookings.confirmed, mentor: { name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska", slug: "x" } } },
};

export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { booking: bookings.refundDelayed } };
