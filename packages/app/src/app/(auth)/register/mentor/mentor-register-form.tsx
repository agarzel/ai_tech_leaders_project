"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { InvitationPreviewDto } from "@devmentor/core";
import { registerMentorFormSchema } from "@devmentor/core/validators/auth/register-mentor.schema";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { CrudForm } from "@devmentor/ui/backend/forms/CrudForm";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";

type Preview = { status: "loading" } | { status: "invalid" } | { status: "valid"; email: string };

/** Mentor sign-up behind an invitation link: shows the invited address, then asks for a name and a password. */
export function MentorRegisterForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [preview, setPreview] = useState<Preview>({ status: token ? "loading" : "invalid" });

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    apiCall<InvitationPreviewDto>("/api/auth/invitations/preview", { method: "POST", body: { token }, signal: controller.signal })
      .then((result) => setPreview(result.ok ? { status: "valid", email: result.data.email } : { status: "invalid" }))
      .catch(() => undefined);
    return () => controller.abort();
  }, [token]);

  if (preview.status === "loading") return <LoadingMessage label="Checking your invitation…" />;

  if (preview.status === "invalid") {
    return (
      <div className="flex flex-col gap-in-group">
        <ErrorMessage
          title="This invitation is no longer valid"
          message="The link was already used, has expired or was replaced. Ask the DevMentor founders for a new one."
        />
        <p className="type-body text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="link-text">
            Sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section">
      <p className="type-body">
        You are creating the mentor account for <strong>{preview.email}</strong>.
      </p>
      <CrudForm
        schema={registerMentorFormSchema}
        fields={[
          { name: "name", label: "Name", placeholder: "Ada Lovelace", autoComplete: "name" },
          { name: "password", label: "Password", description: "12 to 128 characters.", autoComplete: "new-password" },
        ]}
        submitLabel="Create account"
        errorTitle="Could not create the account"
        onSubmit={(values) => apiCall("/api/auth/register/mentor", { method: "POST", body: { ...values, token } })}
        onSuccess={() => {
          // Mentors will land on /mentor once it exists (spec Phase 2); until then the home page.
          router.push("/");
          // The header reads the new cookie on the server.
          router.refresh();
        }}
      />
    </div>
  );
}
