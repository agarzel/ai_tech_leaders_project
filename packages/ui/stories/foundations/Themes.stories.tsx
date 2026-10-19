import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { ThemeProbe } from "../../.storybook/blocks/Foundations";

const meta = { title: "Foundations/Themes" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The theme switch sets the class on <html>, so content rendered outside the story gets it too (rule 9). */
export const RootTheme: Story = {
  render: () => <ThemeProbe />,
  play: async ({ canvas, globals }) => {
    const theme = globals.theme as string;
    await expect(canvas.getByTestId("root-theme")).toHaveTextContent(theme);
    await expect(document.documentElement.classList.contains("dark")).toBe(theme === "dark");
  },
};
