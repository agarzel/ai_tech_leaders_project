import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { focusState, hoverState, StateMatrix } from "../../.storybook/blocks/Docs";

/** A link in running text: a plain <a> with the `link-text` utility from the design system's theme.css. */
function Paragraph({ href = "https://github.com/mkowalczyk/ingress-upgrade" }: { href?: string }) {
  return (
    <p className="max-w-prose">
      Marta wrote up the upgrade in{" "}
      <a className="link-text" href={href}>
        her ingress-nginx migration notes
      </a>
      , which is why mentees with the same error book her.
    </p>
  );
}

const meta = {
  title: "Primitives/Text link",
  component: Paragraph,
} satisfies Meta<typeof Paragraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** States: hover and focus are frozen previews (mirrored in .storybook/storybook.css). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Text link states"
      rows={["Link"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(_, state) => (
        <a className="link-text" href={`#${state.name.toLowerCase()}`} {...state.props}>
          {`Public work (${state.name.toLowerCase()})`}
        </a>
      )}
    />
  ),
};

/** Inside muted text (hints, alerts) the link is still foreground and underlined (T11). */
export const InMutedText: Story = {
  render: () => (
    <p className="max-w-prose type-body text-muted-foreground">
      Mentees see your public work instead of ratings. <a className="link-text" href="#public-work">Why no ratings</a>
    </p>
  ),
};

/** A long link wraps with the sentence at 320 px; the underline follows every line. */
export const LongNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => (
    <p className="max-w-xs">
      See{" "}
      <a className="link-text" href="#long">
        the notes on upgrading ingress-nginx from 1.9 to 1.28 on three production clusters without downtime
      </a>
      .
    </p>
  ),
};

/** Tab focuses the link; it is announced as a link with its text. */
export const KeyboardFocus: Story = {
  args: { href: "#notes" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    const link = canvas.getByRole("link", { name: "her ingress-nginx migration notes" });
    await expect(link).toHaveFocus();
    await expect(link).toHaveAttribute("href", "#notes");
  },
};
