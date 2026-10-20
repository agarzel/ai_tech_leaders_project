import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { focusState, hoverState, StateMatrix } from "../../../.storybook/blocks/Docs";
import { PublicWorkLinks, PublicWorkLinksSkeleton } from "../../../src/components/mentors/PublicWorkLinks";
import { fiveLinks, mentorProfile } from "../../mocks/fixtures";

const meta = {
  title: "Product/E01/PublicWorkLinks",
  component: PublicWorkLinks,
  args: { links: mentorProfile.links, label: "Public work" },
} satisfies Meta<typeof PublicWorkLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Five links – the most a profile keeps (spec E01). */
export const Many: Story = { args: { links: fiveLinks } };

/** No links (partial profile): nothing is rendered. */
export const Empty: Story = { args: { links: [] } };

export const Loading: Story = { render: () => <PublicWorkLinksSkeleton /> };

/** Link states: default, hover, focus (frozen previews of `link-text`). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Public work link states"
      rows={["Link"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(_row, state) => (
        <a className="link-text type-body" href={`#${state.name}`} {...state.props}>
          github.com/marek-zielinski
        </a>
      )}
    />
  ),
};

/** A long address breaks inside the word at 320 px instead of pushing the page sideways. */
export const LongNarrow: Story = { globals: { viewport: { value: "mobile320", isRotated: false } }, args: { links: fiveLinks } };

/** The visible text drops the scheme; the link goes to the full address. */
export const ShortText: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link", { name: "github.com/marek-zielinski" });
    await expect(link).toHaveAttribute("href", "https://github.com/marek-zielinski");
  },
};
