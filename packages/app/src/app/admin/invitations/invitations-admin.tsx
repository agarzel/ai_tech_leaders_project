"use client";

import { useState } from "react";
import { invitationCreateSchema } from "@devmentor/core/validators/mentors/invitation-create.schema";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { CopyField } from "@devmentor/ui/backend/forms/CopyField";
import { CrudForm, type CrudFormField } from "@devmentor/ui/backend/forms/CrudForm";
import { Button } from "@devmentor/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@devmentor/ui/components/ui/card";

type CreatedInvitation = { invitation: { id: string; email: string; expiresAt: string }; link: string };

const fields: CrudFormField<typeof invitationCreateSchema>[] = [
  { name: "email", label: "Mentor email", placeholder: "ada@example.com" },
];

export function InvitationsAdmin() {
  const [created, setCreated] = useState<CreatedInvitation | null>(null);
  // Changing the key resets the form after a link was created.
  const [formKey, setFormKey] = useState(0);

  async function createInvitation(values: { email: string }) {
    const result = await apiCall<CreatedInvitation>("/api/admin/invitations", { method: "POST", body: values });
    if (result.ok) setCreated(result.data);
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
    </div>
  );
}
