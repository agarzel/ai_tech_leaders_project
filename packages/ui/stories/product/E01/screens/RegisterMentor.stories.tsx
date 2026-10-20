import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, userEvent, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import { CrudForm } from "../../../../src/backend/forms/CrudForm";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { Alert, AlertDescription, AlertTitle } from "../../../../src/components/ui/alert";
import { Skeleton } from "../../../../src/components/ui/skeleton";
import { respondError, respondNever, respondOk } from "../../../mocks/api";
import { mentor, mentorRegisterFields, mentorRegisterSchema, newInvitation } from "../../../mocks/fixtures";

const TOKEN = "q7Vt2mKx9LwR4sNp8ZcB1yHd6Jf3Ua0E";
const INVITATION = `/api/auth/invitations/${TOKEN}`;
const REGISTER_MENTOR = "/api/auth/register/mentor";
const NOT_FOUND = { status: 404, code: "not_found", message: "Not found" };

type Check = { state: "loading" } | { state: "valid"; email: string } | { state: "invalid" };

/**
 * `/register/mentor?token=…` (spec E01, Phase 1b; Q7). The page reads the invitation
 * (`GET /api/auth/invitations/[token]` → `{ email, expiresAt }`) to show which address is registered;
 * a used, expired, revoked or unknown link gets one generic answer and no form.
 */
function RegisterMentorScreen() {
  const [check, setCheck] = useState<Check>({ state: "loading" });
  const [created, setCreated] = useState(false);

  useEffect(() => {
    void apiCall<{ email: string; expiresAt: string }>(INVITATION).then((result) =>
      setCheck(result.ok ? { state: "valid", email: result.data.email } : { state: "invalid" }),
    );
  }, []);

  const header = <AppHeader account={<AccountMenu user={null} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />;
  const title = "Join DevMentor as a mentor";

  if (check.state === "loading") {
    return (
      <PageLayout header={header} title={title} width="narrow">
        <div role="status" aria-label="Checking the invitation" className="flex flex-col gap-between-groups">
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
        </div>
      </PageLayout>
    );
  }

  if (check.state === "invalid") {
    return (
      <PageLayout header={header} title={title} width="narrow">
        <Alert role="status">
          <AlertTitle>This invitation is no longer valid</AlertTitle>
          <AlertDescription>Links work once and for 14 days. Ask the DevMentor founders for a new one.</AlertDescription>
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      header={header}
      title={title}
      description={`You were invited as ${check.email}. Choose the name mentees will see and a password.`}
      width="narrow"
    >
      {created ? (
        <p role="status" className="type-body">
          Account created. Next: your profile and prices.
        </p>
      ) : (
        <CrudForm
          schema={mentorRegisterSchema}
          fields={mentorRegisterFields}
          submitLabel="Create mentor account"
          errorTitle="Could not create the account"
          onSubmit={(values) => apiCall(REGISTER_MENTOR, { method: "POST", body: { ...values, token: TOKEN } })}
          onSuccess={() => setCreated(true)}
        />
      )}
    </PageLayout>
  );
}

const valid = respondOk("get", INVITATION, { email: mentor.email, expiresAt: newInvitation.invitation.expiresAt });

const meta = {
  title: "Product/E01/Screens/RegisterMentor",
  component: RegisterMentorScreen,
  parameters: {
    layout: "fullscreen",
    msw: { handlers: [valid, respondOk("post", REGISTER_MENTOR, { id: "u1", name: mentor.name, role: "mentor" }, 201)] },
  },
} satisfies Meta<typeof RegisterMentorScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

async function fill(canvas: ReturnType<typeof within>) {
  await userEvent.type(await canvas.findByLabelText("Name"), mentor.name);
  await userEvent.type(canvas.getByLabelText("Password"), mentor.password);
  await userEvent.click(canvas.getByRole("button", { name: "Create mentor account" }));
}

/** Valid invitation: the invited email is shown; only name and password are asked. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText(/You were invited as marek\.zielinski@example\.com/)).toBeInTheDocument();
  },
};

/** Checking the link (the GET is still running): placeholders, no form yet. */
export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", INVITATION)] } } };

/** Used, expired, revoked or unknown link – the same 404, one message, no form (spec E01, Edge Cases). */
export const InvitationInvalid: Story = {
  parameters: { msw: { handlers: [respondError("get", INVITATION, NOT_FOUND)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("This invitation is no longer valid")).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Create mentor account" })).not.toBeInTheDocument();
  },
};

/** The link was used or revoked while this form was open: the server refuses with the same message. */
export const UsedMeanwhile: Story = {
  parameters: {
    msw: {
      handlers: [
        valid,
        respondError("post", REGISTER_MENTOR, {
          status: 409,
          code: "conflict",
          message: "This invitation is no longer valid. Ask the DevMentor founders for a new link.",
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fill(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("This invitation is no longer valid.");
  },
};

/** After the server confirms; from Phase 2 the mentor lands on `/mentor`. */
export const Success: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fill(canvas);
    await expect(await canvas.findByRole("status")).toHaveTextContent("Account created.");
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
