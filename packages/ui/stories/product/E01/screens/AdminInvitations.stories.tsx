import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useState } from "react";
import { http, HttpResponse } from "msw";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { CrudForm } from "../../../../src/backend/forms/CrudForm";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { DataTable, type DataTableColumn } from "../../../../src/backend/tables/DataTable";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { InvitationLinkPanel } from "../../../../src/components/mentors/InvitationLinkPanel";
import { InvitationStatusBadge, type Invitation } from "../../../../src/components/mentors/InvitationStatusBadge";
import { formatDateTime } from "../../../../src/lib/format";
import { respondError, respondNetworkError, respondNever, respondOk } from "../../../mocks/api";
import { invitationSchema, invitations, nav, newInvitation, signedIn, timeZone } from "../../../mocks/fixtures";

const INVITATIONS = "/api/admin/invitations";
const page = (items: Invitation[]) => ({ items, page: 1, pageSize: 20, total: items.length });

const columns: DataTableColumn<Invitation>[] = [
  { key: "email", header: "Email" },
  { key: "status", header: "Status", cell: (row) => <InvitationStatusBadge status={row.status} /> },
  { key: "createdAt", header: "Sent", cell: (row) => formatDateTime(row.createdAt, timeZone) },
  { key: "expiresAt", header: "Expires", cell: (row) => formatDateTime(row.expiresAt, timeZone) },
];

/**
 * `/admin/invitations` (spec E01, Phase 1b): invite by email, the link is shown once with a copy button,
 * the list shows pending / used / expired. Data comes through the real `apiCall`, answered by MSW.
 */
function AdminInvitationsScreen() {
  const [rows, setRows] = useState<Invitation[]>();
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [created, setCreated] = useState<typeof newInvitation | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await apiCall<{ items: Invitation[] }>(INVITATIONS);
    setIsLoading(false);
    if (!result.ok) return setError(result.error);
    setError(null);
    setRows(result.data.items);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  return (
    <PageLayout
      header={<AppHeader homeHref="/admin" nav={nav.admin} currentHref="/admin/invitations" account={<AccountMenu user={signedIn.admin} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Invitations"
      description="Mentors join only through an invitation. Each link works once, for 14 days."
    >
      {created ? (
        <InvitationLinkPanel
          email={created.invitation.email}
          link={created.link}
          expiresAt={created.invitation.expiresAt}
          timeZone={timeZone}
          onDone={() => {
            setCreated(null);
            void load();
          }}
        />
      ) : (
        <section aria-labelledby="invite-title" className="flex max-w-sm flex-col gap-between-groups">
          <h2 id="invite-title" className="type-section-title">
            Invite a mentor
          </h2>
          <CrudForm
            schema={invitationSchema}
            fields={[{ name: "email", label: "Mentor's email", autoComplete: "off" }]}
            submitLabel="Send invitation"
            errorTitle="Could not create the invitation"
            onSubmit={async (values) => {
              const result = await apiCall<typeof newInvitation>(INVITATIONS, { method: "POST", body: values });
              if (result.ok) setCreated(result.data);
              return result;
            }}
          />
        </section>
      )}
      <section aria-label="Sent invitations" className="flex flex-col gap-in-group">
        <h2 className="type-section-title">Sent invitations</h2>
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(row) => row.id}
          isLoading={isLoading}
          error={error}
          onRetry={() => void load()}
          emptyTitle="No invitations yet"
          emptyDescription="Invite the first mentor with the form on this page."
        />
      </section>
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/AdminInvitations",
  component: AdminInvitationsScreen,
  parameters: {
    layout: "fullscreen",
    msw: { handlers: [respondOk("get", INVITATIONS, page(invitations)), respondOk("post", INVITATIONS, newInvitation, 201)] },
  },
} satisfies Meta<typeof AdminInvitationsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

async function invite(canvas: ReturnType<typeof within>) {
  await userEvent.type(await canvas.findByLabelText("Mentor's email"), newInvitation.invitation.email);
  await userEvent.click(canvas.getByRole("button", { name: "Send invitation" }));
}

/** Form and the list with all three statuses. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("kasia.lewandowska@example.com")).toBeInTheDocument();
  },
};

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", INVITATIONS)] } } };

export const Empty: Story = {
  parameters: { msw: { handlers: [respondOk("get", INVITATIONS, page([]))] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("No invitations yet")).toBeInTheDocument();
  },
};

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", INVITATIONS, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

/** After *Send invitation*: the link replaces the form, shown once; focus is on the link. */
export const LinkShownOnce: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await invite(canvas);
    const link = await canvas.findByLabelText("Invitation link");
    await expect(link).toHaveValue(newInvitation.link);
    await waitFor(() => expect(link).toHaveFocus());
  },
};

/** *Done*: the link is gone for good, the form is back and the list reloads. */
export const LinkDismissed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await invite(canvas);
    await userEvent.click(await canvas.findByRole("button", { name: "Done" }));
    await expect(await canvas.findByLabelText("Mentor's email")).toBeInTheDocument();
    await expect(canvas.queryByLabelText("Invitation link")).not.toBeInTheDocument();
  },
};

/** Sending failed (no network): the typed email stays, the form explains what to do. */
export const SendFailed: Story = {
  parameters: { msw: { handlers: [respondOk("get", INVITATIONS, page(invitations)), respondNetworkError("post", INVITATIONS)] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await invite(canvas);
    await expect(await canvas.findByRole("alert")).toHaveTextContent("No connection");
    await expect(canvas.getByLabelText("Mentor's email")).toHaveValue(newInvitation.invitation.email);
  },
};

/**
 * Re-inviting an email with a pending invitation (Q6): the new link is shown once, and after *Done* the
 * list shows the old invitation as *Revoked* – its link no longer works. The only way to recover a lost link.
 */
let reinvited = false;
const reinvite = { ...newInvitation, invitation: { ...newInvitation.invitation, id: "i5", email: invitations[0].email } };

export const ReinviteRevokesOld: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(INVITATIONS, () =>
          HttpResponse.json({
            ok: true,
            data: page(reinvited ? [reinvite.invitation, { ...invitations[0], status: "revoked" as const }, ...invitations.slice(1)] : invitations),
          }),
        ),
        http.post(INVITATIONS, () => {
          reinvited = true;
          return HttpResponse.json({ ok: true, data: reinvite }, { status: 201 });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    reinvited = false;
    const canvas = within(canvasElement);
    await userEvent.type(await canvas.findByLabelText("Mentor's email"), invitations[0].email);
    await userEvent.click(canvas.getByRole("button", { name: "Send invitation" }));
    await expect(await canvas.findByRole("region", { name: `Invitation for ${invitations[0].email}` })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Done" }));
    await expect(await canvas.findByText("Revoked")).toBeInTheDocument();
    await expect(canvas.getAllByText(invitations[0].email)).toHaveLength(2);
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
