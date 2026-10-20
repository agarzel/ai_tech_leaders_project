import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { AppHeader } from "../../src/backend/layout/AppHeader";
import { PageLayout } from "../../src/backend/layout/PageLayout";
import { EmptyState } from "../../src/backend/feedback/EmptyState";
import { AccountMenu } from "../../src/components/auth/AccountMenu";
import { nav, signedIn } from "../mocks/fixtures";

const header = <AppHeader nav={nav.mentor} currentHref="/mentor/slots" account={<AccountMenu user={signedIn.mentor} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />;

const meta = {
  title: "Primitives/Panel blocks/PageLayout",
  component: PageLayout,
  parameters: { layout: "fullscreen" },
  args: {
    header,
    title: "Slots",
    description: "Times mentees can book. Only times at least 24 hours from now are bookable.",
    width: "content",
    children: <EmptyState title="No slots yet" description="Mentees can book you only at times you publish." />,
  },
  argTypes: { header: { table: { disable: true } }, children: { table: { disable: true } }, width: { control: "inline-radio", options: ["content", "narrow"] } },
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Content width (up to 1024 px, F2): lists and panels. */
export const Playground: Story = {};

/** Narrow width (384 px): one form – sign-in, registration. */
export const Narrow: Story = {
  args: { title: "Log in", description: undefined, width: "narrow", children: <p className="type-body">The form goes here.</p> },
};

/** A long title wraps at 320 px; the side gutter stays 16 px. */
export const LongTitleNarrowScreen: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { title: "Invitation for aleksandra.konstantynopolitanczykiewiczowna@example.com" },
};

/** One banner, one main, one h1 per page. */
export const Landmarks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await expect(canvas.getByRole("main")).toBeInTheDocument();
    await expect(canvas.getByRole("banner")).toBeInTheDocument();
  },
};
