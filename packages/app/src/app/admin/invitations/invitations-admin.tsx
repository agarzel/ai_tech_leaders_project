"use client";

import { useCallback, useEffect, useState } from "react";
import type { InvitationListItemDto, InvitationStatus } from "@devmentor/core";
import { invitationCreateSchema } from "@devmentor/core/validators/mentors/invitation-create.schema";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { CopyField } from "@devmentor/ui/backend/forms/CopyField";
import { CrudForm, type CrudFormField } from "@devmentor/ui/backend/forms/CrudForm";
import { DataTable, type DataTableColumn } from "@devmentor/ui/backend/tables/DataTable";
import { Badge } from "@devmentor/ui/components/ui/badge";
import { Button } from "@devmentor/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@devmentor/ui/components/ui/card";

type CreatedInvitation = { invitation: { id: string; email: string; expiresAt: string }; link: string };

const fields: CrudFormField<typeof invitationCreateSchema>[] = [
  { name: "email", label: "Mentor email", placeholder: "ada@example.com" },
];

const statusVariant: Record<InvitationStatus, "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  used: "outline",
  revoked: "outline",
  expired: "destructive",
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB");

const columns: DataTableColumn<InvitationListItemDto>[] = [
  { key: "email", header: "Email" },
  { key: "status", header: "Status", cell: (row) => <Badge variant={statusVariant[row.status]}>{row.status}</Badge> },
  { key: "createdAt", header: "Created", cell: (row) => formatDate(row.createdAt) },
  { key: "expiresAt", header: "Expires", cell: (row) => formatDate(row.expiresAt) },
  { key: "createdBy", header: "Invited by", cell: (row) => row.createdBy ?? "–" },
];

export function InvitationsAdmin() {
  const [invitations, setInvitations] = useState<InvitationListItemDto[]>();
  const [listError, setListError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const result = await apiCall<InvitationListItemDto[]>("/api/admin/invitations");
    if (!result.ok) {
      setListError(result.error.message);
      return;
    }
    setListError(null);
    setInvitations(result.data);
  }, []);

  useEffect(() => {
    // Fetching on mount is the intended side effect here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  // Changing the key resets the form after a link was created.
  const [formKey, setFormKey] = useState(0);

  async function createInvitation(values: { email: string }) {
    const result = await apiCall<CreatedInvitation>("/api/admin/invitations", { method: "POST", body: values });
    if (result.ok) {
      setCreated(result.data);
      void load();
    }
    return result;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite a mentor</CardTitle>
        </CardHeader>
        <CardContent>
          <CrudForm
            key={formKey}
            schema={invitationCreateSchema}
            fields={fields}
            submitLabel="Create invitation"
            errorTitle="Could not create the invitation"
            onSubmit={createInvitation}
          />
        </CardContent>
      </Card>

      {created && (
        <Card>
          <CardHeader>
            <CardTitle>Invitation for {created.invitation.email}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CopyField
              label="Invitation link"
              value={created.link}
              description={`Send it to the mentor yourself. It is shown only once and works until ${new Date(created.invitation.expiresAt).toLocaleDateString("en-GB")}. Inviting the same address again cancels this link.`}
              autoFocus
            />
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                setFormKey((key) => key + 1);
              }}
            >
              Done – invite another mentor
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            rows={invitations}
            getRowId={(row) => row.id}
            isLoading={!invitations && !listError}
            error={listError}
            onRetry={() => void load()}
            emptyTitle="No invitations yet"
            emptyDescription="Create the first invitation with the form above."
          />
        </CardContent>
      </Card>
    </div>
  );
}
