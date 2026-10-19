import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { Checkbox } from "../../src/components/ui/checkbox";
import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from "../../src/components/ui/field";
import { focusState, StateMatrix, type PreviewState } from "../../.storybook/blocks/Docs";

const tags = ["TypeScript", "React", "Python", "AI agents"] as const;

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  args: { "aria-label": "React", onCheckedChange: fn() },
  argTypes: {
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    "aria-invalid": { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The main use: several values from a short list – the mentor's stack tags. */
export const StackTags: Story = {
  render: () => (
    <FieldSet className="max-w-sm">
      <FieldLegend>Stack tags</FieldLegend>
      <FieldDescription>Mentees filter the public list by these.</FieldDescription>
      {tags.map((tag) => (
        <Field key={tag} orientation="horizontal">
          <Checkbox id={`tag-${tag.replace(" ", "-")}`} name="tags" value={tag} defaultChecked={tag === "React"} />
          <FieldLabel htmlFor={`tag-${tag.replace(" ", "-")}`}>{tag}</FieldLabel>
        </Field>
      ))}
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
      caption="Checkbox states"
      rows={["Unchecked", "Checked"] as const}
      states={states}
      render={(row, state) => (
        <Checkbox
          aria-label={`TypeScript, ${row.toLowerCase()}, ${state.name.toLowerCase()}`}
          defaultChecked={row === "Checked"}
          {...state.props}
        />
      )}
    />
  ),
};

/** A label with a hint beside the box; long text wraps and the box stays on the first line. */
export const LongLabelNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <Field orientation="horizontal" className="max-w-xs">
      <Checkbox id="long-tag" />
      <FieldContent>
        <FieldLabel htmlFor="long-tag">AI agents – tool calling, evaluation and running them in production</FieldLabel>
        <FieldDescription>Only if your public work shows it.</FieldDescription>
      </FieldContent>
    </Field>
  ),
};

/** Click on the box or the label, or Space, toggles it. */
export const TogglesByPointerAndKeyboard: Story = {
  render: (args) => (
    <Field orientation="horizontal">
      <Checkbox id="toggle-python" onCheckedChange={args.onCheckedChange} />
      <FieldLabel htmlFor="toggle-python">Python</FieldLabel>
    </Field>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole("checkbox", { name: "Python" });
    await expect(box).not.toBeChecked();

    await userEvent.click(box);
    await expect(box).toBeChecked();

    await userEvent.click(canvas.getByText("Python"));
    await expect(box).not.toBeChecked();

    box.focus();
    await userEvent.keyboard(" ");
    await expect(box).toBeChecked();
    await expect(args.onCheckedChange).toHaveBeenCalledTimes(3);
  },
};
