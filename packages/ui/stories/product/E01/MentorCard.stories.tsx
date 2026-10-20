import type { Meta, StoryObj } from "@storybook/react-vite";

import { focusState, hoverState, StateMatrix } from "../../../.storybook/blocks/Docs";
import { ItemGroup } from "../../../src/components/ui/item";
import { MentorCard, MentorCardSkeleton } from "../../../src/components/mentors/MentorCard";
import { publicMentorLong, publicMentorPartial, publicMentors, timeZone } from "../../mocks/fixtures";

const meta = {
  title: "Product/E01/MentorCard",
  component: MentorCard,
  args: { mentor: publicMentors[0], href: `/m/${publicMentors[0].slug}`, timeZone },
  argTypes: { mentor: { control: "object" }, renderLink: { table: { disable: true } } },
  render: (args) => (
    <ItemGroup aria-label="Mentors">
      <MentorCard {...args} />
    </ItemGroup>
  ),
} satisfies Meta<typeof MentorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** The list the card is made for: a single column of dense rows, no avatars, no grid (C6). */
export const InAList: Story = {
  render: () => (
    <ItemGroup aria-label="Mentors">
      {publicMentors.map((mentor) => (
        <MentorCard key={mentor.slug} mentor={mentor} href={`/m/${mentor.slug}`} timeZone={timeZone} />
      ))}
    </ItemGroup>
  ),
};

/** Optional parts missing: no headline, tags, links or next time; a price not set reads "Not set". */
export const Partial: Story = { args: { mentor: publicMentorPartial, href: `/m/${publicMentorPartial.slug}` } };

/** The longest values the spec allows: a 120-character headline (cut to one line, full text on hover), five links, four tags, the largest prices. */
export const LongText: Story = { args: { mentor: publicMentorLong, href: `/m/${publicMentorLong.slug}` } };

/** The row link: hover underlines the name, focus ring on the whole row (frozen previews). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Mentor card row states"
      rows={["Row"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(_row, state) => (
        <ItemGroup aria-label="Mentors">
          <MentorCard mentor={publicMentors[1]} href="/m/x" timeZone={timeZone} renderLink={(props) => <a {...props} {...state.props} />} />
        </ItemGroup>
      )}
    />
  ),
};

export const Loading: Story = { render: () => <MentorCardSkeleton /> };

/** At 320 px prices move under the text. */
export const Narrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { mentor: publicMentorLong, href: "/m/x" } };
