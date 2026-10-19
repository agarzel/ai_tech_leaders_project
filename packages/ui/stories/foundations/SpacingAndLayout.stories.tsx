import type { Meta, StoryObj } from "@storybook/react-vite";

import { SpacingExample, SpacingScale } from "../../.storybook/blocks/Foundations";

const meta = { title: "Foundations/Spacing and layout" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scale: Story = { render: () => <SpacingScale /> };
export const Example: Story = { render: () => <SpacingExample /> };
