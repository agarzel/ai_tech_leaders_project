import type { Meta, StoryObj } from "@storybook/react-vite";

import { IconGallery } from "../../.storybook/blocks/Foundations";

const meta = { title: "Foundations/Icons" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Gallery: Story = { render: () => <IconGallery /> };
