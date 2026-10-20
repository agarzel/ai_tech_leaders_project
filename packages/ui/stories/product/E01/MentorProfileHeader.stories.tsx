import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { MentorProfileHeader, MentorProfileHeaderSkeleton } from "../../../src/components/mentors/MentorProfileHeader";
import { fiveLinks, longBio, mentorProfile } from "../../mocks/fixtures";

const meta = {
  title: "Product/E01/MentorProfileHeader",
  component: MentorProfileHeader,
  args: { mentor: mentorProfile },
} satisfies Meta<typeof MentorProfileHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Headline, stack, public work and bio (share page `/m/[slug]`). */
export const Playground: Story = {};

/** Only a headline (partial profile): the missing parts are left out, not filled with placeholders. */
export const Partial: Story = { args: { mentor: { headline: mentorProfile.headline, bio: null, tags: [], links: [] } } };

/** Nothing filled in yet: the section is empty – the share page then relies on the name and the times. */
export const Empty: Story = { args: { mentor: { headline: null, bio: null, tags: [], links: [] } } };

export const Loading: Story = { render: () => <MentorProfileHeaderSkeleton /> };

/** A long bio with paragraphs and five links at 320 px. Lines stay within about 65 characters on wide screens. */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { mentor: { ...mentorProfile, links: fiveLinks, bio: longBio } },
};

export const Region: Story = {
  play: async ({ canvasElement }) => {
    const region = within(canvasElement).getByRole("region", { name: "About the mentor" });
    await expect(region).toHaveTextContent(mentorProfile.headline);
  },
};
