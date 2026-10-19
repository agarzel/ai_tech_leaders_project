import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "../../src/components/ui/native-select";
import { Field, FieldDescription, FieldError, FieldLabel } from "../../src/components/ui/field";
import { focusState, hoverState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const lengths = (
  <>
    <NativeSelectOption value="25">25 minutes · PLN 120.00</NativeSelectOption>
    <NativeSelectOption value="50">50 minutes · PLN 220.00</NativeSelectOption>
  </>
);

const meta = {
  title: "Primitives/NativeSelect",
  component: NativeSelect,
  args: { "aria-label": "Session length", children: lengths, onChange: fn() },
  argTypes: {
    size: { control: "inline-radio", options: ["default", "sm"] },
    disabled: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
  },
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** `default` in forms; `sm` only as a filter or action inside a dense row. Option groups for long lists. */
export const SizesAndGroups: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-between-groups">
      <NativeSelect aria-label="Session length">{lengths}</NativeSelect>
      <NativeSelect size="sm" aria-label="Rows per page" defaultValue="25">
        <NativeSelectOption value="25">25 per page</NativeSelectOption>
        <NativeSelectOption value="50">50 per page</NativeSelectOption>
      </NativeSelect>
      <NativeSelect aria-label="Time zone" defaultValue="Europe/Warsaw">
        <NativeSelectOptGroup label="Europe">
          <NativeSelectOption value="Europe/Warsaw">Europe/Warsaw (CET)</NativeSelectOption>
          <NativeSelectOption value="Europe/London">Europe/London (GMT)</NativeSelectOption>
        </NativeSelectOptGroup>
        <NativeSelectOptGroup label="America">
          <NativeSelectOption value="America/New_York">America/New_York (EST)</NativeSelectOption>
        </NativeSelectOptGroup>
      </NativeSelect>
    </div>
  ),
};

const states: PreviewState[] = [
  { name: "Default", props: {} },
  hoverState,
  focusState,
  { name: "Disabled", props: { disabled: true } },
  { name: "Invalid", props: { "aria-invalid": true } },
];

/** Hover and focus are frozen previews (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Native select states by size"
      rows={["default", "sm"] as const}
      states={states}
      render={(size, state) => (
        <NativeSelect size={size} aria-label={`Session length, ${size}, ${state.name.toLowerCase()}`} {...state.props}>
          {lengths}
        </NativeSelect>
      )}
    />
  ),
};

/** Long option text is cut by the closed select; at 320 px the select takes the full width. */
export const LongOptionNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Field>
      <FieldLabel htmlFor="tag-long">Stack tag</FieldLabel>
      <NativeSelect id="tag-long" className="w-full" defaultValue="ai">
        <NativeSelectOption value="ts">TypeScript</NativeSelectOption>
        <NativeSelectOption value="ai">AI agents – tool calling, evaluation and production monitoring</NativeSelectOption>
      </NativeSelect>
    </Field>
  ),
};

/** Choosing with the keyboard changes the value; the error is linked to the select. */
export const KeyboardChoice: Story = {
  render: (args) => (
    <Field data-invalid>
      <FieldLabel htmlFor="length-choice">Session length</FieldLabel>
      <NativeSelect id="length-choice" aria-invalid aria-describedby="length-choice-error" defaultValue="" onChange={args.onChange}>
        <NativeSelectOption value="" disabled>
          Choose a length
        </NativeSelectOption>
        {lengths}
      </NativeSelect>
      <FieldDescription>The price is charged when you pay.</FieldDescription>
      <FieldError id="length-choice-error">Choose 25 or 50 minutes to see the price.</FieldError>
    </Field>
  ),
  play: async ({ args, canvasElement }) => {
    const select = within(canvasElement).getByRole("combobox", { name: "Session length" });
    await expect(select).toHaveAccessibleDescription(/Choose 25 or 50 minutes/);

    await userEvent.selectOptions(select, "50");
    await expect(select).toHaveValue("50");
    await expect(args.onChange).toHaveBeenCalledTimes(1);
  },
};
