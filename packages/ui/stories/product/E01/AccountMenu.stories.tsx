import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { focusState, hoverState, StateMatrix } from "../../../.storybook/blocks/Docs";
import { apiCall } from "../../../src/backend/api/apiCall";
import { AccountMenu, AccountMenuSkeleton, type SessionUser } from "../../../src/components/auth/AccountMenu";
import { respondError, respondNetworkError, respondNever, respondOk } from "../../mocks/api";
import { signedIn } from "../../mocks/fixtures";

const LOGOUT = "/api/auth/logout";

/** The header's account area as the app wires it: logout through the real apiCall (MSW answers). */
function Wired({ user: initial }: { user: SessionUser | null }) {
  const [user, setUser] = useState(initial);
  return <AccountMenu user={user} onLogout={() => apiCall(LOGOUT, { method: "POST" })} onLoggedOut={() => setUser(null)} />;
}

const meta = {
  title: "Product/E01/AccountMenu",
  component: Wired,
  args: { user: signedIn.mentee },
  parameters: { msw: { handlers: [respondOk("post", LOGOUT, null)] } },
} satisfies Meta<typeof Wired>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Signed in: the name and *Log out*. */
export const Playground: Story = {};

/** Visitor: *Log in* (link) and *Register* (outline button). */
export const SignedOut: Story = { args: { user: null } };

/** Session still loading (`GET /api/auth/me`): a placeholder the size of the links (C3). */
export const Loading: Story = { render: () => <AccountMenuSkeleton /> };

/** Links: default, hover and focus (frozen previews) – the same ring as every button and field (T4). */
export const States: Story = {
  render: () => (
    <StateMatrix
      caption="Account links"
      rows={["Visitor"] as const}
      states={[{ name: "Default", props: {} }, hoverState, focusState]}
      render={(_row, state) => (
        <AccountMenu
          user={null}
          loginHref={`/login#${state.name}`}
          registerHref={`/register#${state.name}`}
          onLogout={async () => ({ ok: true, data: null, status: 200 })}
          renderLink={(props) => <a {...props} {...state.props} />}
        />
      )}
    />
  ),
};

/** A long name is truncated; the full name stays in the title attribute. At 320 px the area wraps under the word mark in `AppHeader`. */
export const LongNameNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  args: { user: { id: "u6", name: "Aleksandra Konstantynopolitańczykiewiczówna-Grzybowska", role: "mentor" } },
};

/** Logging out: the button is busy until the server clears the cookie, then the visitor links appear. */
export const LogOut: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Log out" }));
    await expect(await canvas.findByRole("link", { name: "Log in" })).toBeInTheDocument();
  },
};

/** Waiting for the server. */
export const LoggingOut: Story = {
  parameters: { msw: { handlers: [respondNever("post", LOGOUT)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Log out" }));
    await expect(await canvas.findByRole("button", { name: "Logging out…" })).toBeDisabled();
  },
};

/** Logout failed: the person stays signed in and reads why. */
export const LogoutFailed: Story = {
  parameters: { msw: { handlers: [respondNetworkError("post", LOGOUT)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Log out" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Could not log out.");
    await expect(canvas.getByRole("button", { name: "Log out" })).toBeEnabled();
  },
};

/** The session already expired on the server (24 h, spec E01): logout still ends on the visitor links. */
export const SessionAlreadyExpired: Story = {
  parameters: { msw: { handlers: [respondError("post", LOGOUT, { status: 401, code: "unauthorized", message: "Authentication required" })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Log out" }));
    await expect(await canvas.findByRole("link", { name: "Log in" })).toBeInTheDocument();
  },
};
