import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { Label } from "../../src/components/ui/label";
import { Input } from "../../src/components/ui/input";

const meta = {
  title: "Primitives/Label",
  component: Label,
  args: { children: "Email", htmlFor: "label-playground" },
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-in-group">
      <Label {...args} />
      <Input id="label-playground" type="email" autoComplete="email" />
    </div>
  ),
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** No variants. Next to a disabled control (`peer`) or inside a disabled Field the label is dimmed. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-between-groups">
      <div className="flex flex-col gap-in-group">
        <Label htmlFor="label-default">Headline</Label>
        <Input id="label-default" />
      </div>
      <div className="flex flex-col-reverse gap-in-group">
        <Input id="label-disabled" className="peer" disabled defaultValue="marta-kowalczyk-4f9k2a" />
        <Label htmlFor="label-disabled">Share link slug</Label>
      </div>
    </div>
  ),
};

/** Long and translated labels wrap instead of overflowing (P2: type-label has its own line height). */
export const LongLabelNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <div className="flex max-w-xs flex-col gap-in-group">
      <Label htmlFor="label-long">Link to public work that shows you have solved this kind of problem</Label>
      <Input id="label-long" type="url" />
    </div>
  ),
};

/** Clicking the label moves focus to its control. */
export const ClickFocusesControl: Story = {
  args: { children: "Email", htmlFor: "label-click" },
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-in-group">
      <Label {...args} />
      <Input id="label-click" type="email" autoComplete="email" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText("Email"));
    await expect(canvas.getByRole("textbox", { name: "Email" })).toHaveFocus();
  },
};
