import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Input } from "../../src/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../src/components/ui/field";
import { focusState, hoverState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const meta = {
  title: "Primitives/Input",
  component: Input,
  args: { "aria-label": "Headline", placeholder: "e.g. Kubernetes upgrades without downtime" },
  argTypes: {
    type: { control: "inline-radio", options: ["text", "email", "password", "url", "number", "datetime-local"] },
    disabled: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Input has one look; the type changes the keyboard and the browser's checks, not the style. */
export const Types: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-between-groups">
      <Input aria-label="Email" type="email" autoComplete="email" defaultValue="marta.kowalczyk@example.com" />
      <Input aria-label="Password" type="password" autoComplete="current-password" defaultValue="correct-horse-battery" />
      <Input aria-label="Public work link" type="url" defaultValue="https://github.com/mkowalczyk/ingress-upgrade" />
      <Input aria-label="Price for 25 minutes in PLN" type="number" inputMode="decimal" defaultValue="120" />
      <Input aria-label="Slot start" type="datetime-local" defaultValue="2026-11-03T18:00" />
    </div>
  ),
};

const rows = ["Empty", "Filled"] as const;
const states: PreviewState[] = [
  { name: "Default", props: {} },
  hoverState,
  focusState,
  { name: "Disabled", props: { disabled: true } },
  { name: "Invalid", props: { "aria-invalid": true } },
  { name: "Invalid + focus", props: { "aria-invalid": true, "data-preview-state": "focus-visible" } },
];

/** Hover and focus are frozen previews (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Input states"
      rows={rows}
      states={states}
      render={(row, state) => (
        <Input
          aria-label={`Headline, ${row.toLowerCase()}, ${state.name.toLowerCase()}`}
          placeholder="e.g. Kubernetes upgrades"
          defaultValue={row === "Filled" ? "Ingress-nginx 1.28 upgrades" : undefined}
          className="w-48"
          {...state.props}
        />
      )}
    />
  ),
};

/** Long values scroll inside the field; at 320 px the field is full width. */
export const LongValueNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Field>
      <FieldLabel htmlFor="headline-long">Headline</FieldLabel>
      <Input
        id="headline-long"
        aria-describedby="headline-long-hint"
        maxLength={120}
        defaultValue="I upgraded ingress-nginx from 1.9 to 1.28 on three production clusters without downtime and can walk you through it"
      />
      <FieldDescription id="headline-long-hint">Up to 120 characters. Name the work, not the years.</FieldDescription>
    </Field>
  ),
};

/** Typing works and the value stays; an invalid field announces its error. */
export const TypingAndError: Story = {
  render: () => (
    <Field data-invalid>
      <FieldLabel htmlFor="link-error">Public work link</FieldLabel>
      <Input id="link-error" type="url" aria-invalid aria-describedby="link-error-message" defaultValue="github.com/mkowalczyk" />
      <FieldError id="link-error-message">Enter a full address starting with https://, for example https://github.com/your-name.</FieldError>
    </Field>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Public work link" });
    await expect(input).toHaveAccessibleDescription(/starting with https:\/\//);
    await expect(input).toBeInvalid();

    await userEvent.clear(input);
    await userEvent.type(input, "https://github.com/mkowalczyk");
    await expect(input).toHaveValue("https://github.com/mkowalczyk");

    await userEvent.tab();
    await expect(input).not.toHaveFocus();
    await expect(input).toHaveValue("https://github.com/mkowalczyk");
  },
};
