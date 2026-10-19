import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Switch } from "../../src/components/ui/switch";
import { Field, FieldContent, FieldDescription, FieldLabel } from "../../src/components/ui/field";
import { focusState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const meta = {
  title: "Primitives/Switch",
  component: Switch,
  args: { "aria-label": "Show me on the public list", onCheckedChange: fn() },
  argTypes: { defaultChecked: { control: "boolean" }, disabled: { control: "boolean" } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** A setting that takes effect immediately, with its label first and the switch at the end of the row. */
export const PublicListSetting: Story = {
  render: () => (
    <Field orientation="horizontal" className="max-w-md">
      <FieldContent>
        <FieldLabel htmlFor="listed">Show me on the public list</FieldLabel>
        <FieldDescription id="listed-hint">Your share link works either way.</FieldDescription>
      </FieldContent>
      <Switch id="listed" aria-describedby="listed-hint" />
    </Field>
  ),
};

const states: PreviewState[] = [
  { name: "Default", props: {} },
  focusState,
  { name: "Disabled", props: { disabled: true } },
];

/** No hover style. Focus is a frozen preview (data-preview-state, documentation only). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Switch states"
      rows={["Off", "On"] as const}
      states={states}
      render={(row, state) => (
        <Switch
          aria-label={`Show me on the public list, ${row.toLowerCase()}, ${state.name.toLowerCase()}`}
          defaultChecked={row === "On"}
          {...state.props}
        />
      )}
    />
  ),
};

/**
 * The reason a switch is disabled is written next to it (B17). Long labels wrap at 320 px.
 * Illustration only: the mentor-accounts spec does not disable this switch (a mentor without prices is simply listed nowhere).
 */
export const DisabledWithReasonNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Field orientation="horizontal" data-disabled className="max-w-xs">
      <FieldContent>
        <FieldLabel htmlFor="listed-disabled">Show me on the public list of mentors</FieldLabel>
        <FieldDescription id="listed-disabled-hint">Set both prices first – a mentor without prices is listed nowhere.</FieldDescription>
      </FieldContent>
      <Switch id="listed-disabled" disabled aria-describedby="listed-disabled-hint" />
    </Field>
  ),
};

/** Click, label click and Space turn it on and off. */
export const TogglesByPointerAndKeyboard: Story = {
  render: (args) => (
    <Field orientation="horizontal" className="max-w-md">
      <FieldLabel htmlFor="listed-toggle">Show me on the public list</FieldLabel>
      <Switch id="listed-toggle" onCheckedChange={args.onCheckedChange} />
    </Field>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const control = canvas.getByRole("switch", { name: "Show me on the public list" });
    await expect(control).not.toBeChecked();

    await userEvent.click(control);
    await expect(control).toBeChecked();

    await userEvent.click(canvas.getByText("Show me on the public list"));
    await expect(control).not.toBeChecked();

    control.focus();
    await userEvent.keyboard(" ");
    await expect(control).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
  },
};
