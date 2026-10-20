import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { focusState, hoverState, StateMatrix } from "../../.storybook/blocks/Docs";
import { RoleNav } from "../../src/backend/layout/RoleNav";
import { nav } from "../mocks/fixtures";

const meta = {
  title: "Primitives/Panel blocks/RoleNav",
  component: RoleNav,
  args: { items: nav.mentor, currentHref: "/mentor/slots", label: "Main" },
} satisfies Meta<typeof RoleNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** One fixed list per role – only pages that exist (R02.6/P12; audit: no "Coming soon"). */
export const PerRole: Story = {
  render: () => (
    <div className="flex flex-col gap-between-groups">
      {(Object.keys(nav) as (keyof typeof nav)[]).map((role) => (
        <div key={role} className="flex flex-col gap-in-group">
          <span className="type-meta text-muted-foreground">{role}</span>
          <RoleNav items={nav[role]} currentHref={nav[role][0].href} label={`${role} navigation`} />
        </div>
      ))}
    </div>
  ),
};

/** Default, hover and focus (frozen previews), and the current page. One focus ring for every link (T4). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Navigation link states"
      rows={["Link", "Current page"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(row, state) => (
        <RoleNav
          label={`${row} ${state.name}`}
          items={[{ label: "Slots", href: `#${row}-${state.name}` }]}
          currentHref={row === "Current page" ? `#${row}-${state.name}` : undefined}
          renderLink={(props) => <a {...props} {...state.props} />}
        />
      )}
    />
  ),
};

/** At 320 px the links wrap onto a second line; nothing scrolls sideways. Labels stay short (one or two words). */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
};

/** Tab moves through the links in order; the current page is announced as "current page". */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Overview" })).toHaveFocus();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "Slots" })).toHaveFocus();
    await expect(canvas.getByRole("link", { name: "Slots" })).toHaveAttribute("aria-current", "page");
  },
};
