import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";

type PanelArgs = { title: string; description: string; withAction: boolean; withFooter: boolean; onEdit?: () => void };

/** A panel as it appears on the mentor checklist (`/mentor`). */
function PricesPanel({ title, description, withAction, withFooter, onEdit }: PanelArgs) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {withAction ? (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit prices
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="tabular-nums">25 min · PLN 120.00 · 50 min · PLN 220.00</p>
      </CardContent>
      {withFooter ? (
        <CardFooter>
          <span className="type-meta text-muted-foreground">A price change applies only to new bookings.</span>
        </CardFooter>
      ) : null}
    </Card>
  );
}

const meta = {
  title: "Primitives/Card",
  component: PricesPanel,
  args: {
    title: "Prices",
    description: "Shown on your card before mentees write a question.",
    withAction: true,
    withFooter: true,
    onEdit: fn(),
  },
} satisfies Meta<typeof PricesPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every part: header (title, description, action), content, footer. */
export const Anatomy: Story = {};

/** Minimal: content only – a panel that frames a list or a form. */
export const ContentOnly: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardContent>
        <p>No times available right now.</p>
      </CardContent>
    </Card>
  ),
};

/** A card has no interactive states; its parts (buttons, links) have their own. Shown in both surfaces. */
export const States: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-between-groups md:grid-cols-2">
      <PricesPanel title="Prices" description="Both prices are set." withAction withFooter={false} />
      <Card>
        <CardHeader>
          <CardTitle>Bookable slots</CardTitle>
          <CardDescription>You need at least one slot to be bookable.</CardDescription>
          <CardAction>
            <Badge variant="outline">Missing</Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  ),
};

/** Long titles wrap next to the action; at 320 px the card is full width. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: {
    title: "Prices for text sessions of 25 and 50 minutes",
    description: "Shown on your card and on your share page before mentees write a question. Gross amounts in PLN.",
  },
};

/** The header action is an ordinary button inside the panel. */
export const ActionWorks: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Edit prices" }));
    await expect(args.onEdit).toHaveBeenCalledTimes(1);
    await expect(canvas.getByText("Prices")).toBeVisible();
  },
};
