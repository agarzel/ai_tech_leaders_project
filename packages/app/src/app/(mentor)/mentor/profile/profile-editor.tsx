"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MentorProfileDto } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { MentorProfileForm, type MentorProfileInput } from "@devmentor/ui/components/mentors/MentorProfileForm";

type State = { status: "loading" } | { status: "error"; error: ApiError } | { status: "ready"; profile: MentorProfileDto & { tagOptions: string[] } };

/** Loads the signed-in mentor's own profile and saves it back through `PUT /api/mentor/profile`. */
export function ProfileEditor() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    apiCall<MentorProfileDto & { tagOptions: string[] }>("/api/mentor/profile", { signal: controller.signal })
      .then((result) => setState(result.ok ? { status: "ready", profile: result.data } : { status: "error", error: result.error }))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  if (state.status === "loading") return <LoadingMessage label="Loading your profile…" />;
  if (state.status === "error") return <ErrorMessage title="Could not load your profile" error={state.error} />;

  const { profile } = state;
  return (
    <MentorProfileForm
      initialValues={{
        name: profile.name,
        headline: profile.headline ?? "",
        bio: profile.bio ?? "",
        tags: profile.tags,
        links: profile.links,
        price25: profile.price25,
        price50: profile.price50,
        listed: profile.listed,
      }}
      tagOptions={profile.tagOptions}
      currency={profile.currency}
      showVisibility={false}
      onSubmit={(values: MentorProfileInput) => apiCall("/api/mentor/profile", { method: "PUT", body: values })}
      // The checklist and the header name come from the server.
      onSaved={() => router.refresh()}
    />
  );
}
