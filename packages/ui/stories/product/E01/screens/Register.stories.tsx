import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import { CrudForm } from "../../../../src/backend/forms/CrudForm";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { respondError, respondOk } from "../../../mocks/api";
import { mentee, nav, registerFields, registerSchema, sessionUser } from "../../../mocks/fixtures";

const REGISTER = "/api/auth/register";

/** `/register` (spec E01, Phase 1): mentees register themselves; mentors only by invitation (D11). */
function RegisterScreen() {
  const [created, setCreated] = useState(false);
  return (
    <PageLayout
      header={<AppHeader nav={nav.visitor} account={<AccountMenu user={null} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Create your account"
      description="Book a 25- or 50-minute text session with a mentor about one specific problem."
      width="narrow"
    >
      {created ? (
        <p role="status" className="type-body">
          Account created. You are signed in.
        </p>
      ) : (
        <div className="flex flex-col gap-between-groups">
          <CrudForm
            schema={registerSchema}
            fields={registerFields}
            submitLabel="Create account"
            errorTitle="Could not create the account"
            onSubmit={(values) => apiCall(REGISTER, { method: "POST", body: values })}
            onSuccess={() => setCreated(true)}
          />
          <p className="type-body text-muted-foreground">
            Already registered?{" "}
            <a className="link-text" href="/login">
              Log in
            </a>
          </p>
        </div>
      )}
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/Register",
  component: RegisterScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [respondOk("post", REGISTER, sessionUser, 201)] } },
} satisfies Meta<typeof RegisterScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

async function fill(canvas: ReturnType<typeof within>, password = mentee.password) {
  await userEvent.type(canvas.getByLabelText("Name"), mentee.name);
  await userEvent.type(canvas.getByLabelText("Email"), mentee.email);
  await userEvent.type(canvas.getByLabelText("Password"), password);
}

export const Default: Story = {};

/** Password under 12 characters: refused before the request (spec E01: 12–128 characters). */
export const PasswordTooShort: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fill(canvas, "ingress");
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(canvas.getByLabelText("Password")).toHaveFocus());
    await expect(canvas.getByLabelText("Password")).toHaveAccessibleDescription(/Use at least 12 characters\./);
  },
};

/** Email already registered: a generic conflict at the field that does not confirm the account (spec E01). */
export const EmailTaken: Story = {
  parameters: {
    msw: {
      handlers: [
        respondError("post", REGISTER, {
          status: 409,
          code: "conflict",
          message: "Check the highlighted field.",
          fieldErrors: { email: ["This email cannot be used to register. Log in, or use another email."] },
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fill(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await waitFor(() => expect(canvas.getByLabelText("Email")).toHaveFocus());
  },
};

/** After the server confirms. */
export const Success: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fill(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "Create account" }));
    await expect(await canvas.findByRole("status")).toHaveTextContent("Account created.");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
