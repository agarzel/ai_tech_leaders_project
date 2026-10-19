import type { Meta, StoryObj } from "@storybook/react-vite";

import { TypeRoles } from "../../.storybook/blocks/Foundations";

const meta = { title: "Foundations/Typography" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Roles: Story = { render: () => <TypeRoles /> };
