import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { RadioGroup, RadioGroupItem } from "../../src/components/ui/radio-group";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "../../src/components/ui/field";
import { focusState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const lengths = [
  { value: "25", label: "25 minutes · PLN 120.00", hint: "One focused question." },
  { value: "50", label: "50 minutes · PLN 220.00", hint: "A question with code to walk through." },
];

/** The session-length choice as it appears before the question box (R01.5/P5: price before writing). */
function SessionLength({ onValueChange, defaultValue = "25" }: { onValueChange?: (value: unknown) => void; defaultValue?: string }) {
  return (
    <FieldSet className="max-w-sm">
      <FieldLegend>Session length</FieldLegend>
      <RadioGroup name="length" defaultValue={defaultValue} onValueChange={onValueChange}>
        {lengths.map((length) => (
          <Field key={length.value} orientation="horizontal">
            <RadioGroupItem id={`length-${length.value}`} value={length.value} aria-describedby={`length-${length.value}-hint`} />
            <FieldContent>
              <FieldLabel htmlFor={`length-${length.value}`}>{length.label}</FieldLabel>
              <FieldDescription id={`length-${length.value}-hint`}>{length.hint}</FieldDescription>
            </FieldContent>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  );
}

const meta = {
  title: "Primitives/RadioGroup",
  component: SessionLength,
  args: { onValueChange: fn() },
} satisfies Meta<typeof SessionLength>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** One option is always chosen; options without hints sit 8 px apart. */
export const WithoutHints: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Show times in</FieldLegend>
      <RadioGroup defaultValue="local">
        <Field orientation="horizontal">
          <RadioGroupItem id="zone-local" value="local" />
          <FieldLabel htmlFor="zone-local">My time zone (Europe/Warsaw)</FieldLabel>
        </Field>
        <Field orientation="horizontal">
          <RadioGroupItem id="zone-utc" value="utc" />
          <FieldLabel htmlFor="zone-utc">UTC</FieldLabel>
        </Field>
      </RadioGroup>
    </FieldSet>
  ),
};

const states: PreviewState[] = [
  { name: "Default", props: {} },
  focusState,
  { name: "Disabled", props: { disabled: true } },
  { name: "Invalid", props: { "aria-invalid": true } },
];

/** No hover style. Focus is a frozen preview (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Radio states"
      rows={["Unselected", "Selected"] as const}
      states={states}
      render={(row, state) => (
        <RadioGroup defaultValue={row === "Selected" ? "a" : undefined} aria-label={`${row}, ${state.name}`}>
          <RadioGroupItem value="a" aria-label={`50 minutes, ${row.toLowerCase()}, ${state.name.toLowerCase()}`} {...state.props} />
        </RadioGroup>
      )}
    />
  ),
};

/** Long option text wraps beside the dot at 320 px. */
export const LongOptionNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { defaultValue: "50" },
};

/** Arrow keys move the choice inside the group; Tab leaves the group. */
export const ArrowKeysChoose: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const short = canvas.getByRole("radio", { name: /25 minutes/ });
    const long = canvas.getByRole("radio", { name: /50 minutes/ });
    await expect(short).toBeChecked();

    await userEvent.click(long);
    await expect(long).toBeChecked();

    await userEvent.keyboard("{ArrowUp}");
    await expect(short).toBeChecked();
    await expect(short).toHaveFocus();
    await expect(args.onValueChange).toHaveBeenCalledTimes(2);
  },
};
