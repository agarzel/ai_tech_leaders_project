import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, ExternalLink } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import { Button } from "../../src/components/ui/button";
import { Spinner } from "../../src/components/ui/spinner";
import { focusState, hoverState, pressedState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

const meta = {
  title: "Primitives/Button",
  component: Button,
  args: { children: "Accept booking", onClick: fn() },
  argTypes: {
    variant: { control: "inline-radio", options: variants },
    size: { control: "inline-radio", options: ["default", "sm", "icon", "icon-sm"] },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** One example per variant, with the product action it is for. */
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-in-group">
      <Button>Pay PLN 180.00</Button>
      <Button variant="secondary">Add slot</Button>
      <Button variant="outline">Edit profile</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Decline booking</Button>
      <Button variant="link">View public work</Button>
    </div>
  ),
};

/** `default` everywhere; `sm` only for row actions in dense lists; icon sizes always with aria-label. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-in-group">
      <Button>Save profile</Button>
      <Button size="sm" variant="outline">
        Edit
      </Button>
      <Button size="icon" variant="outline" aria-label="Copy share link">
        <Copy />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Open public work in a new tab">
        <ExternalLink />
      </Button>
      <Button variant="outline">
        <Copy data-icon="inline-start" aria-hidden="true" />
        Copy share link
      </Button>
    </div>
  ),
};

const disabledState: PreviewState = { name: "Disabled", props: { disabled: true } };
const loadingState: PreviewState = { name: "Loading", props: { disabled: true, "aria-busy": true } };
const invalidState: PreviewState = { name: "Invalid", props: { "aria-invalid": true } };

/** Hover, focus and pressed are frozen previews (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Button states by variant"
      rows={variants}
      states={[{ name: "Default", props: {} }, hoverState, focusState, pressedState, disabledState, loadingState, invalidState]}
      render={(variant, state) => (
        <Button variant={variant} {...state.props}>
          {state.name === "Loading" ? (
            <>
              <Spinner aria-hidden="true" data-icon="inline-start" />
              Saving…
            </>
          ) : (
            "Accept"
          )}
        </Button>
      )}
    />
  ),
};

/** A disabled action always shows why, as visible text next to it (B17). */
export const DisabledWithReason: Story = {
  render: () => (
    <div className="flex max-w-prose flex-col items-start gap-in-group">
      <Button disabled aria-describedby="share-reason">
        Copy share link
      </Button>
      <p id="share-reason" className="type-body text-muted-foreground">
        Add at least one bookable slot first – mentees cannot book you until then.
      </p>
    </div>
  ),
};

/** Labels do not wrap; at 320 px a long label makes the button full width instead of overflowing. */
export const LongLabelNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="flex w-full max-w-xs flex-col gap-in-group">
      <Button className="w-full">Book 50 min · PLN 340.00</Button>
      <Button variant="outline" className="w-full">
        Show me on the public list
      </Button>
    </div>
  ),
};

/** Click, Enter and Space activate; a disabled button does nothing. */
export const ActivatesByPointerAndKeyboard: Story = {
  args: { children: "Accept booking" },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Accept booking" });

    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);

    button.blur();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard(" ");
    await expect(args.onClick).toHaveBeenCalledTimes(3);
  },
};

export const DisabledDoesNotActivate: Story = {
  args: { children: "Pay PLN 180.00", disabled: true },
  play: async ({ args, canvasElement }) => {
    const button = within(canvasElement).getByRole("button", { name: "Pay PLN 180.00" });
    await expect(button).toBeDisabled();
    await userEvent.click(button, { pointerEventsCheck: 0 });
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
