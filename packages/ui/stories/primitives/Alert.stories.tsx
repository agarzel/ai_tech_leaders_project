import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, Info } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "../../src/components/ui/alert";
import { Button } from "../../src/components/ui/button";

type AlertArgs = { variant: "default" | "destructive"; title: string; description: string; withAction: boolean; onRetry?: () => void };

function PaymentAlert({ variant, title, description, withAction, onRetry }: AlertArgs) {
  return (
    <Alert variant={variant} className="max-w-xl">
      {variant === "destructive" ? <CircleAlert aria-hidden="true" /> : <Info aria-hidden="true" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      {withAction ? (
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        </AlertAction>
      ) : null}
    </Alert>
  );
}

const meta = {
  title: "Primitives/Alert",
  component: PaymentAlert,
  args: {
    variant: "destructive",
    title: "Payment could not start",
    description: "Card payments are unavailable right now. Your slot is not held – try again in a few minutes.",
    withAction: true,
    onRetry: fn(),
  },
  argTypes: { variant: { control: "inline-radio", options: ["default", "destructive"] } },
} satisfies Meta<typeof PaymentAlert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `default` informs, `destructive` reports a failure that needs action. Both with an icon and a title. */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-in-group">
      <Alert role="status">
        <Info aria-hidden="true" />
        <AlertTitle>The mentor may decline your question</AlertTitle>
        <AlertDescription>
          If they do, or do not answer 12 hours before the session, you get a full refund.{" "}
          <a href="#refunds">How refunds work</a>
        </AlertDescription>
      </Alert>
      <PaymentAlert
        variant="destructive"
        title="Payment could not start"
        description="Card payments are unavailable right now. Your slot is not held – try again in a few minutes."
        withAction={false}
      />
    </div>
  ),
};

/** An alert has no interactive states; its action and links have theirs. Without an icon the text spans the full width. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-xl flex-col gap-in-group">
      <Alert role="status">
        <AlertTitle>No times available right now</AlertTitle>
      </Alert>
      <Alert variant="destructive">
        <AlertTitle>This booking no longer exists or you do not have access to it.</AlertTitle>
      </Alert>
    </div>
  ),
};

/** Long text wraps; at 320 px the action keeps its place on the right. */
export const LongTextNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: {
    title: "We could not confirm your payment yet",
    description:
      "Stripe has not told us the result. If the money left your account, the booking appears within a few minutes; if not, nothing was charged and the slot is released after 35 minutes.",
  },
};

/** The alert is announced; its action works. */
export const AnnouncedAndActionable: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("Payment could not start");
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await expect(args.onRetry).toHaveBeenCalledTimes(1);
  },
};
