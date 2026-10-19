import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Search } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "../../src/components/ui/input-group";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../src/components/ui/field";
import { focusState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const shareLink = "https://devmentor.example/m/marta-kowalczyk-4f9k2a";

/** The share link shown with a copy button (mentor checklist, admin invitations). */
function ShareLink({ onCopy }: { onCopy?: () => void }) {
  return (
    <Field className="max-w-md">
      <FieldLabel htmlFor="share-link">Your share link</FieldLabel>
      <InputGroup>
        <InputGroupInput id="share-link" readOnly value={shareLink} aria-describedby="share-link-hint" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Copy share link" onClick={onCopy}>
            <Copy />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldDescription id="share-link-hint">Anyone with this link can see your offer and book you.</FieldDescription>
    </Field>
  );
}

const meta = {
  title: "Primitives/InputGroup",
  component: ShareLink,
  args: { onCopy: fn() },
} satisfies Meta<typeof ShareLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Addon positions: icon before, unit text after, button after, text below a textarea. */
export const Addons: Story = {
  render: () => (
    <div className="flex max-w-md flex-col gap-between-groups">
      <InputGroup>
        <InputGroupInput aria-label="Filter bookings by mentee name" placeholder="e.g. Jan" />
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Price for 25 minutes" type="number" inputMode="decimal" defaultValue="120" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>PLN</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupInput aria-label="Invitation link" readOnly value="https://devmentor.example/invite/7c1e…" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="sm" variant="outline">
            <Copy data-icon="inline-start" aria-hidden="true" />
            Copy link
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <InputGroup>
        <InputGroupTextarea aria-label="Your question" defaultValue="Our ingress-nginx pods restart every few hours after the upgrade to 1.28." />
        <InputGroupAddon align="block-end">
          <InputGroupText className="type-meta tabular-nums">74 / 2,000</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

const states: PreviewState[] = [
  { name: "Default", props: {} },
  focusState,
  { name: "Disabled", props: { disabled: true } },
  { name: "Invalid", props: { "aria-invalid": true } },
];

/** The group shows the state of its input. Focus is a frozen preview on the input (documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Input group states"
      rows={["With unit"] as const}
      states={states}
      render={(_, state) => (
        <InputGroup className="w-40">
          <InputGroupInput aria-label={`Price, ${state.name.toLowerCase()}`} defaultValue="120" {...state.props} />
          <InputGroupAddon align="inline-end">
            <InputGroupText>PLN</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
      )}
    />
  ),
};

/** A long value scrolls inside the input; the button stays visible at 320 px. */
export const LongValueNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Field data-invalid className="max-w-xs">
      <FieldLabel htmlFor="price-error">Price for 50 minutes</FieldLabel>
      <InputGroup>
        <InputGroupInput id="price-error" type="number" defaultValue="5" aria-invalid aria-describedby="price-error-message" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>PLN</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id="price-error-message">Enter a price between PLN 10 and PLN 10,000.</FieldError>
    </Field>
  ),
};

/** The button runs its action; clicking an addon's text focuses the input. */
export const CopyAndAddonFocus: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Copy share link" }));
    await expect(args.onCopy).toHaveBeenCalledTimes(1);

    const input = canvas.getByRole("textbox", { name: "Your share link" });
    await expect(input).toHaveValue(shareLink);
    await expect(input).toHaveAccessibleDescription(/Anyone with this link/);
  },
};

export const AddonClickFocusesInput: Story = {
  render: () => (
    <InputGroup className="max-w-xs">
      <InputGroupInput aria-label="Price for 25 minutes" type="number" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>PLN</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("PLN"));
    await expect(canvas.getByRole("spinbutton", { name: "Price for 25 minutes" })).toHaveFocus();
  },
};
