import { useId, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "../../src/components/ui/field";
import { Checkbox } from "../../src/components/ui/checkbox";
import { Switch } from "../../src/components/ui/switch";
import { Input } from "../../src/components/ui/input";
import { NativeSelect, NativeSelectOption } from "../../src/components/ui/native-select";
import { Textarea } from "../../src/components/ui/textarea";
import { Button } from "../../src/components/ui/button";
import { focusState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

type PlaygroundArgs = {
  label: string;
  hint: string;
  error: string;
  optional: boolean;
  invalid: boolean;
  disabled: boolean;
};

/** One field wired the documented way: label → id, hint and error → aria-describedby. */
function HeadlineField({ label, hint, error, optional, invalid, disabled }: PlaygroundArgs) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, invalid && error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined} className="max-w-sm">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      <Input id={id} aria-invalid={invalid || undefined} aria-describedby={describedBy} disabled={disabled} />
      {hint ? <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription> : null}
      {invalid ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
    </Field>
  );
}

const meta = {
  title: "Primitives/Field",
  component: HeadlineField,
  args: {
    label: "Headline",
    hint: "Up to 120 characters. Name the work, not the years.",
    error: "Enter a headline – mentees see it on your card.",
    optional: false,
    invalid: false,
    disabled: false,
  },
} satisfies Meta<typeof HeadlineField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Every part: label (with optional marker), control, hint, error. */
export const Anatomy: Story = {
  render: () => (
    <FieldGroup className="max-w-sm">
      <HeadlineField label="Headline" hint="Up to 120 characters. Name the work, not the years." error="" optional={false} invalid={false} disabled={false} />
      <HeadlineField label="Second public work link" hint="A repository, talk or article you made." error="" optional invalid={false} disabled={false} />
      <HeadlineField label="Price for 25 minutes (PLN)" hint="" error="Enter a price between PLN 10 and PLN 10,000." optional={false} invalid disabled={false} />
    </FieldGroup>
  ),
};

/** Vertical for text fields; horizontal for checkbox, radio and switch, with FieldSet for a group. */
export const Orientations: Story = {
  render: () => (
    <FieldGroup className="max-w-md">
      <Field>
        <FieldLabel htmlFor="orient-headline">Headline</FieldLabel>
        <Input id="orient-headline" />
      </Field>
      <FieldSet>
        <FieldLegend>Stack tags</FieldLegend>
        <Field orientation="horizontal">
          <Checkbox id="orient-ts" />
          <FieldLabel htmlFor="orient-ts">TypeScript</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <Checkbox id="orient-py" />
          <FieldLabel htmlFor="orient-py">Python</FieldLabel>
        </Field>
      </FieldSet>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="orient-listed">Show me on the public list</FieldLabel>
          <FieldDescription id="orient-listed-hint">Your share link works either way.</FieldDescription>
        </FieldContent>
        <Switch id="orient-listed" aria-describedby="orient-listed-hint" />
      </Field>
    </FieldGroup>
  ),
};

const rows = ["Required", "Optional"] as const;
const states: PreviewState[] = [
  { name: "Default", props: {} },
  focusState,
  { name: "Invalid", props: { invalid: true } },
  { name: "Disabled", props: { disabled: true } },
];

/** Focus is a frozen preview on the control (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Field states"
      rows={rows}
      states={states}
      render={(row, state) => {
        const invalid = state.props.invalid === true;
        const disabled = state.props.disabled === true;
        const id = `field-${row}-${state.name}`.toLowerCase();
        return (
          <Field data-invalid={invalid || undefined} data-disabled={disabled || undefined} className="w-56">
            <FieldLabel htmlFor={id} optional={row === "Optional"}>
              Headline
            </FieldLabel>
            <Input
              id={id}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? `${id}-error` : `${id}-hint`}
              disabled={disabled}
              data-preview-state={state.props["data-preview-state"] as string | undefined}
            />
            {invalid ? <FieldError id={`${id}-error`}>Enter a headline.</FieldError> : <FieldDescription id={`${id}-hint`}>Up to 120 characters.</FieldDescription>}
          </Field>
        );
      }}
    />
  ),
};

/** A real form: 16 px between fields, 8 px inside a field; at 320 px everything stacks. */
export const FormNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <form className="flex max-w-prose flex-col gap-section" onSubmit={(event) => event.preventDefault()}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="form-length">Session length</FieldLabel>
          <NativeSelect id="form-length" className="w-full">
            <NativeSelectOption value="25">25 minutes · PLN 120.00</NativeSelectOption>
            <NativeSelectOption value="50">50 minutes · PLN 220.00</NativeSelectOption>
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="form-question">Your question</FieldLabel>
          <Textarea id="form-question" aria-describedby="form-question-hint" />
          <FieldDescription id="form-question-hint">
            The mentor reads it before accepting and may decline it – you then get a full refund. Up to 2,000 characters.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="form-link" optional>
            Link to your repository or a gist with the failing code, if you can share it publicly
          </FieldLabel>
          <Input id="form-link" type="url" />
        </Field>
      </FieldGroup>
      <Button type="submit" className="w-full md:w-fit">
        Pay PLN 120.00
      </Button>
    </form>
  ),
};

/** Validates when the field is left and on submit; typed data stays; the error goes away when fixed. */
function ValidatedHeadline() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const validate = (next: string) => setError(next.trim() ? null : "Enter a headline – mentees see it on your card.");
  return (
    <form
      className="flex max-w-sm flex-col gap-between-groups"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        validate(value);
      }}
    >
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="validated-headline">Headline</FieldLabel>
        <Input
          id="validated-headline"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => validate(value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "validated-headline-error" : undefined}
        />
        <FieldError id="validated-headline-error">{error}</FieldError>
      </Field>
      <Button type="submit" className="w-fit">
        Save profile
      </Button>
    </form>
  );
}

export const ValidationOnBlur: Story = {
  render: () => <ValidatedHeadline />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "Headline" });

    await userEvent.click(input);
    await userEvent.tab();
    await expect(input).toBeInvalid();
    await expect(canvas.getByRole("alert")).toHaveTextContent("Enter a headline");
    await expect(input).toHaveAccessibleDescription(/Enter a headline/);

    await userEvent.type(input, "Ingress-nginx upgrades without downtime");
    await userEvent.tab();
    await expect(input).toBeValid();
    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();
    await expect(input).toHaveValue("Ingress-nginx upgrades without downtime");
  },
};
