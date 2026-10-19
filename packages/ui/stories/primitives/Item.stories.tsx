import type { Meta, StoryObj } from "@storybook/react-vite";
import { CalendarClock } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemMedia, ItemTitle } from "../../src/components/ui/item";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";

const bookings = [
  { id: "b1", question: "Ingress-nginx pods restart every few hours after the 1.28 upgrade", meta: "Jan Nowak · Tue 3 Nov, 18:00 CET · 50 min · PLN 220.00", status: "Awaiting mentor" },
  { id: "b2", question: "Migrating a React 18 app to the new compiler", meta: "Ola Wójcik · Thu 5 Nov, 19:30 CET · 25 min · PLN 120.00", status: "Confirmed" },
  { id: "b3", question: "Evaluating tool calls of a support agent", meta: "Piotr Zieliński · Mon 9 Nov, 17:00 CET · 25 min · PLN 120.00", status: "Declined" },
];

/** The mentor's bookings list (`/mentor/bookings`): dense rows, title + one metadata line (R01.1). */
function BookingsList({ onAccept }: { onAccept?: () => void }) {
  return (
    <ItemGroup className="max-w-3xl">
      {bookings.map((booking) => (
        <Item key={booking.id}>
          <ItemContent>
            <ItemTitle>
              <ItemLink href={`#booking-${booking.id}`}>{booking.question}</ItemLink>
            </ItemTitle>
            <ItemDescription>{booking.meta}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Badge variant={booking.status === "Declined" ? "destructive" : "secondary"}>{booking.status}</Badge>
            {booking.status === "Awaiting mentor" ? (
              <Button size="sm" variant="outline" onClick={onAccept}>
                Accept
              </Button>
            ) : null}
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  );
}

const meta = {
  title: "Primitives/Item",
  component: BookingsList,
  args: { onAccept: fn() },
} satisfies Meta<typeof BookingsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Parts: media (icon), title, one metadata line, actions. Rows without a link are plain list items. */
export const Anatomy: Story = {
  render: () => (
    <ItemGroup className="max-w-xl">
      <Item>
        <ItemMedia variant="icon">
          <CalendarClock aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Tue 3 Nov, 18:00 CET</ItemTitle>
          <ItemDescription>50 min block · bookable</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button size="sm" variant="ghost">
            Delete slot
          </Button>
        </ItemActions>
      </Item>
      <Item>
        <ItemMedia variant="icon">
          <CalendarClock aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Wed 4 Nov, 09:00 CET</ItemTitle>
          <ItemDescription>50 min block · not bookable – starts too soon</ItemDescription>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};

/** Linked rows: hover tints the row, focus on the link outlines the whole row (frozen previews). */
export const States: Story = {
  render: () => (
    <ItemGroup className="max-w-xl">
      {(["Default", "Hover", "Focus"] as const).map((state) => (
        <Item key={state} data-preview-state={state === "Hover" ? "hover" : undefined}>
          <ItemContent>
            <ItemTitle>
              <ItemLink
                href={`#${state.toLowerCase()}`}
                data-preview-state={state === "Hover" ? "hover" : state === "Focus" ? "focus-visible" : undefined}
              >
                {`${state}: Ingress-nginx pods restart after the upgrade`}
              </ItemLink>
            </ItemTitle>
            <ItemDescription>Jan Nowak · Tue 3 Nov, 18:00 CET · 50 min</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  ),
};

/** Long titles and metadata are cut with an ellipsis to keep one line each (R01.1); at 320 px actions stay. */
export const LongTextNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
};

/** Tab reaches the row link, then the row's actions; Enter opens the row; the action does not open it. */
export const KeyboardAndActions: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const rows = canvas.getAllByRole("listitem");
    await expect(rows).toHaveLength(3);

    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: /Ingress-nginx pods restart/ })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Accept" })).toHaveFocus();

    await userEvent.click(canvas.getByRole("button", { name: "Accept" }));
    await expect(args.onAccept).toHaveBeenCalledTimes(1);
  },
};
