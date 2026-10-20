import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import { CrudForm } from "../../../../src/backend/forms/CrudForm";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { respondError, respondNetworkError, respondOk } from "../../../mocks/api";
import { loginFields, loginSchema, mentee, nav, signedIn } from "../../../mocks/fixtures";

const LOGIN = "/api/auth/login";

/** `/login` (spec E01, Phase 1): email and password; after success the app goes to `/` (mentors to `/mentor`). */
function LoginScreen() {
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  return (
    <PageLayout
      header={<AppHeader nav={nav.visitor} account={<AccountMenu user={null} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Log in"
      width="narrow"
    >
      {signedInAs ? (
        <p role="status" className="type-body">
          Signed in as {signedInAs}.
        </p>
      ) : (
        <div className="flex flex-col gap-between-groups">
          <CrudForm
            schema={loginSchema}
            fields={loginFields}
            submitLabel="Log in"
            errorTitle="Could not log in"
            onSubmit={(values) => apiCall(LOGIN, { method: "POST", body: values })}
            onSuccess={() => setSignedInAs(signedIn.mentee.name)}
          />
          <p className="type-body text-muted-foreground">
            No account yet?{" "}
            <a className="link-text" href="/register">
              Register
            </a>
          </p>
        </div>
      )}
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/Login",
  component: LoginScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [respondOk("post", LOGIN, signedIn.mentee)] } },
} satisfies Meta<typeof LoginScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

async function submit(canvas: ReturnType<typeof within>) {
  await userEvent.type(canvas.getByLabelText("Email"), mentee.email);
  await userEvent.type(canvas.getByLabelText("Password"), mentee.password);
  await userEvent.click(canvas.getByRole("button", { name: "Log in" }));
}

export const Default: Story = {};

/** Wrong email or password: one generic message that does not say which (spec E01). Focus moves to it. */
export const InvalidCredentials: Story = {
  parameters: { msw: { handlers: [respondError("post", LOGIN, { status: 401, code: "unauthorized", message: "Invalid email or password." })] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await submit(canvas);
    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("Could not log in");
    await expect(alert).toHaveTextContent("Invalid email or password.");
    await waitFor(() => expect(alert.parentElement).toHaveFocus());
    await expect(canvas.getByLabelText("Email")).toHaveValue(mentee.email);
  },
};

/** 5 failed attempts in 15 minutes (spec E01, Edge Cases): 429 with the time to wait. */
export const RateLimited: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("post", LOGIN, { status: 429, code: "rate_limited", message: "Too many attempts. Try again in 15 minutes." }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await submit(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Try again in 15 minutes.");
  },
};

export const NetworkError: Story = {
  parameters: { msw: { handlers: [respondNetworkError("post", LOGIN)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await submit(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("No connection");
  },
};

/** After the server confirms (the app then redirects). */
export const Success: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await submit(canvas);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Signed in as Ola Wiśniewska.");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
