import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShapeScale, SpacingExample } from "../../.storybook/blocks/Foundations";

const meta = { title: "Foundations/Shape and depth" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Radii: Story = { render: () => <ShapeScale /> };
/** Separation by a 1 px line and a frame, never by a shadow (R01.3). */
export const SeparatedList: Story = { render: () => <SpacingExample /> };
