import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { TagList, TagListSkeleton } from "../../../src/components/mentors/TagList";
import { tagOptions } from "../../mocks/fixtures";

const meta = {
  title: "Product/E01/TagList",
  component: TagList,
  args: { tags: ["Python", "AI agents"], label: "Stack" },
} satisfies Meta<typeof TagList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** All four MENTOR_TAGS (the most a mentor can have). */
export const AllTags: Story = { args: { tags: tagOptions } };

/** No tags (partial profile): nothing is rendered – no "No tags" placeholder text. */
export const Empty: Story = { args: { tags: [] } };

export const Loading: Story = { render: () => <TagListSkeleton /> };

/** At 320 px tags wrap onto the next line. */
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { tags: tagOptions } };

/** A named list, one item per tag. */
export const ReadAsList: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole("listitem")).toHaveLength(2);
  },
};
