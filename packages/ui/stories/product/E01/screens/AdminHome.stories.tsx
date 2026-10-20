import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemLink, ItemTitle } from "../../../../src/components/ui/item";
import { nav, signedIn } from "../../../mocks/fixtures";

const sections = [
  { title: "Users", href: "/admin/users", description: "Mentors, mentees and administrators." },
  { title: "Invitations", href: "/admin/invitations", description: "Invite a mentor by email; each link works once, for 14 days." },
];

/**
 * `/admin` in the design system: the role's short navigation and a dense list of the sections that
 * exist – instead of the current grid of four cards, three of them "Coming soon" (audit 2026-10-19,
 * A01; R02.6/P12; R01.1). The app page itself is unchanged (rule 11) – see "What is missing".
 */
function AdminHomeScreen() {
  return (
    <PageLayout
      header={<AppHeader homeHref="/admin" nav={nav.admin} account={<AccountMenu user={signedIn.admin} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Admin"
      description="Manage accounts and invite mentors."
    >
      <ItemGroup aria-label="Admin sections">
        {sections.map((section) => (
          <Item key={section.href}>
            <ItemContent>
              <ItemTitle>
                <ItemLink href={section.href}>{section.title}</ItemLink>
              </ItemTitle>
              <ItemDescription>{section.description}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/AdminHome",
  component: AdminHomeScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AdminHomeScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };

/** Every link – navigation, word mark, list rows – takes the same focus ring (audit: three different ones). */
export const KeyboardFocus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole("link", { name: "DevMentor" })).toHaveFocus();
    await userEvent.tab();
    await expect(within(canvas.getByRole("navigation", { name: "Main" })).getByRole("link", { name: "Users" })).toHaveFocus();
    await expect(canvas.queryByText(/coming soon/i)).not.toBeInTheDocument();
  },
};
