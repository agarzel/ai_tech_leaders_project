"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import type { SessionUserDto } from "@devmentor/core";
import { loginSchema } from "@devmentor/core/validators/auth/login.schema";
import { registerSchema } from "@devmentor/core/validators/auth/register.schema";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { CrudForm } from "@devmentor/ui/backend/forms/CrudForm";
import { homePathFor } from "../../lib/home-path";

/** The sign-in and sign-up forms: same schemas as the API routes, same flow after success. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  // The destination depends on the role the server answered with; CrudForm's onSuccess carries no data.
  const destination = useRef("/");

  async function submit(url: string, values: unknown) {
    const result = await apiCall<SessionUserDto>(url, { method: "POST", body: values });
    if (result.ok) destination.current = homePathFor(result.data.role);
    return result;
  }

  function onSuccess() {
    router.push(destination.current);
    // The header reads the new cookie on the server.
    router.refresh();
  }

  if (mode === "login") {
    return (
      <CrudForm
        schema={loginSchema}
        fields={[
          { name: "email", label: "Email", placeholder: "ada@example.com", autoComplete: "email" },
          { name: "password", label: "Password", autoComplete: "current-password" },
        ]}
        submitLabel="Sign in"
        errorTitle="Could not sign in"
        onSubmit={(values) => submit("/api/auth/login", values)}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <CrudForm
      schema={registerSchema}
      fields={[
        { name: "name", label: "Name", placeholder: "Ada Lovelace", autoComplete: "name" },
        { name: "email", label: "Email", placeholder: "ada@example.com", autoComplete: "email" },
        { name: "password", label: "Password", description: "12 to 128 characters.", autoComplete: "new-password" },
      ]}
      submitLabel="Create account"
      errorTitle="Could not create the account"
      onSubmit={(values) => submit("/api/auth/register", values)}
      onSuccess={onSuccess}
    />
  );
}
