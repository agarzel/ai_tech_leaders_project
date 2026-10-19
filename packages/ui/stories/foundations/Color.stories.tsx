import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor } from "storybook/test";

import { ColorRoles, ContrastTable } from "../../.storybook/blocks/Foundations";

const meta = {
  title: "Foundations/Color",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Roles: Story = { render: () => <ColorRoles /> };

/** Fails when any text pair is below 4.5:1 or any UI pair below 3:1, except approved exceptions (T5). */
const contrastStory = (theme: "light" | "dark"): Story => ({
  render: () => <ContrastTable theme={theme} />,
  play: async ({ canvas, canvasElement }) => {
    await waitFor(() => expect(canvas.queryAllByText("Measuring…")).toHaveLength(0));
    const failing = canvasElement
      .querySelectorAll('tr[data-result="fix-needed"]');
    await expect(Array.from(failing, (row) => row.textContent)).toEqual([]);
  },
});

export const ContrastLight = contrastStory("light");
export const ContrastDark = contrastStory("dark");
