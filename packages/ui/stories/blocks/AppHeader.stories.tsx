import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "storybook/test";

import { AppHeader } from "../../src/backend/layout/AppHeader";
import { AccountMenu } from "../../src/components/auth/AccountMenu";
import { nav, signedIn } from "../mocks/fixtures";

const logout = async () => ({ ok: true as const, data: null, status: 200 });

type Role = keyof typeof nav;

const accountFor = (role: Role) => (role === "visitor" ? <AccountMenu user={null} onLogout={logout} /> : <AccountMenu user={signedIn[role]} onLogout={logout} />);

const meta = {
  title: "Primitives/Panel blocks/AppHeader",
  parameters: { layout: "fullscreen" },
  args: { role: "mentor" as Role },
  argTypes: { role: { control: "inline-radio", options: ["visitor", "mentee", "mentor", "admin"] } },
  render: ({ role }) => <AppHeader nav={nav[role]} currentHref={nav[role][0].href} account={accountFor(role)} />,
} satisfies Meta<{ role: Role }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/**
 * Visitor, mentee, mentor and admin: the same header, a different short list (R02.6/P12). Each sits in
 * its own labelled section here only so the page has one banner (a real page has one header).
 */
export const PerRole: Story = {
  render: () => (
    <div className="flex flex-col gap-section">
      {(["visitor", "mentee", "mentor", "admin"] as Role[]).map((role) => (
        <section key={role} aria-label={`Header for ${role}`}>
          <AppHeader nav={nav[role]} currentHref={nav[role][0].href} navLabel={`${role} navigation`} account={accountFor(role)} />
        </section>
      ))}
    </div>
  ),
};

/** Sign-in pages: word mark and account links only. */
export const Minimal: Story = { render: () => <AppHeader account={<AccountMenu user={null} onLogout={logout} />} /> };

/** At 320 px the navigation wraps under the word mark; the account area stays on the right. */
export const Narrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { role: "mentor" },
};

/** A long name is truncated in the header (the full name is in the title attribute and on the profile). */
export const LongName: Story = {
  render: () => (
    <AppHeader
      nav={nav.mentor}
      currentHref="/mentor"
      account={<AccountMenu user={{ id: "u6", name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska", role: "mentor" }} onLogout={logout} />}
    />
  ),
};

/** One banner landmark with the word mark linking home and a named navigation landmark. */
export const Landmarks: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("banner")).toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "DevMentor" })).toHaveAttribute("href", "/");
    await expect(canvas.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  },
};
