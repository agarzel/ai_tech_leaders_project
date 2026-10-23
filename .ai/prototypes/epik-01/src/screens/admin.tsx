// s06 Zaproszenia: formularz, link pokazany raz, lista (pending / used / expired / revoked).
import { useState } from "react";
import { z } from "zod";

import { CrudForm } from "@devmentor/ui/backend/forms/CrudForm";
import { DataTable, type DataTableColumn } from "@devmentor/ui/backend/tables/DataTable";
import { InvitationLinkPanel } from "@devmentor/ui/components/mentors/InvitationLinkPanel";
import { InvitationStatusBadge } from "@devmentor/ui/components/mentors/InvitationStatusBadge";
import type { Invitation } from "@devmentor/ui/components/mentors/types";
import { formatDateTime } from "@devmentor/ui/lib/format";

import { Page } from "../chrome";
import { go, Guard } from "../nav";
import { createInvitation, invitationRows, TIME_ZONE, tokenFromLink, useStore } from "../sim/store";

const invitationSchema = z.object({ email: z.email("Enter the mentor's email address, like marek@example.com.") });
const columns: DataTableColumn<Invitation>[] = [
  { key: "email", header: "Email" },
  { key: "status", header: "Status", cell: (row) => <InvitationStatusBadge status={row.status} /> },
  { key: "createdAt", header: "Sent", cell: (row) => formatDateTime(row.createdAt, TIME_ZONE) },
  { key: "expiresAt", header: "Expires", cell: (row) => formatDateTime(row.expiresAt, TIME_ZONE) },
];

export function InvitationsScreen() {
  const state = useStore();
  const [created, setCreated] = useState<{ invitation: Invitation; link: string } | null>(null);
  return (
    <Guard role="admin" path="/admin/invitations">
      <Page current="/admin/invitations" title="Invitations" description="Mentors join only through an invitation. Each link works once, for 14 days.">
        {created ? (
          <div className="flex flex-col gap-between-groups">
            <InvitationLinkPanel email={created.invitation.email} link={created.link} expiresAt={created.invitation.expiresAt} timeZone={TIME_ZONE} onDone={() => setCreated(null)} />
            {/* Sterowanie prototypu (nie produktu): DevMentor nie wysyła e-maili, założyciel przekazuje link ręcznie (D15). */}
            <p className="type-meta text-muted-foreground">
              Prototype:{" "}
              <a
                className="link-text"
                href={created.link}
                onClick={(event) => {
                  event.preventDefault();
                  go(`/register/mentor?token=${tokenFromLink(created.link)}`);
                }}
              >
                open this link as the mentor (simulated)
              </a>
              . No email is sent.
            </p>
          </div>
        ) : (
          <section aria-labelledby="invite-title" className="flex max-w-sm flex-col gap-between-groups">
            <h2 id="invite-title" className="type-section-title">
              Invite a mentor
            </h2>
            <CrudForm
              schema={invitationSchema}
              fields={[{ name: "email", label: "Mentor's email", autoComplete: "off", placeholder: "anna.maj@example.com" }]}
              submitLabel="Send invitation"
              errorTitle="Could not create the invitation"
              onSubmit={async (values) => {
                const result = await createInvitation(values.email);
                if (result.ok) setCreated(result.data);
                return result;
              }}
            />
          </section>
        )}
        <section aria-label="Sent invitations" className="flex flex-col gap-in-group">
          <h2 className="type-section-title">Sent invitations</h2>
          <DataTable columns={columns} rows={invitationRows(state)} getRowId={(row) => row.id} emptyTitle="No invitations yet" emptyDescription="Invite the first mentor with the form on this page." />
        </section>
      </Page>
    </Guard>
  );
}
