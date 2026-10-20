import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useEffect, useState } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { apiCall } from "../../../../src/backend/api/apiCall";
import type { ApiError } from "../../../../src/backend/api/types";
import { ErrorMessage } from "../../../../src/backend/feedback/ErrorMessage";
import { AppHeader } from "../../../../src/backend/layout/AppHeader";
import { PageLayout } from "../../../../src/backend/layout/PageLayout";
import { AccountMenu } from "../../../../src/components/auth/AccountMenu";
import { MentorProfileForm, type MentorProfile } from "../../../../src/components/mentors/MentorProfileForm";
import { Skeleton } from "../../../../src/components/ui/skeleton";
import { respondError, respondNever, respondOk } from "../../../mocks/api";
import { mentorProfile, nav, newMentorProfile, signedIn, tagOptions } from "../../../mocks/fixtures";

const PROFILE = "/api/mentor/profile";

/** `/mentor/profile` (spec E01, Phase 2 + the list toggle of Phase 4): reads the own profile, saves with PUT. */
function MentorProfileScreen() {
  const [profile, setProfile] = useState<MentorProfile>();
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const result = await apiCall<MentorProfile>(PROFILE);
    if (!result.ok) return setError(result.error);
    setProfile(result.data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching on mount is the intended effect
    void load();
  }, [load]);

  return (
    <PageLayout
      header={<AppHeader nav={nav.mentor} currentHref="/mentor/profile" account={<AccountMenu user={signedIn.mentor} onLogout={async () => ({ ok: true, data: null, status: 200 })} />} />}
      title="Profile and prices"
      description="What mentees see on your share link and on the public list."
    >
      {error ? (
        <ErrorMessage title="Could not load your profile" error={error} onRetry={() => void load()} />
      ) : !profile ? (
        <div role="status" aria-label="Loading your profile" className="flex max-w-xl flex-col gap-between-groups">
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-control w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
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
          tagOptions={tagOptions}
          currency={profile.currency}
          onSubmit={(values) => apiCall(PROFILE, { method: "PUT", body: values })}
        />
      )}
    </PageLayout>
  );
}

const meta = {
  title: "Product/E01/Screens/MentorProfile",
  component: MentorProfileScreen,
  parameters: { layout: "fullscreen", msw: { handlers: [respondOk("get", PROFILE, mentorProfile), respondOk("put", PROFILE, mentorProfile)] } },
} satisfies Meta<typeof MentorProfileScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A complete profile. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByLabelText("Headline")).toHaveValue(mentorProfile.headline);
  },
};

/** First visit: name only, empty prices. */
export const NewProfile: Story = { parameters: { msw: { handlers: [respondOk("get", PROFILE, newMentorProfile)] } } };

export const Loading: Story = { parameters: { msw: { handlers: [respondNever("get", PROFILE)] } } };

export const LoadError: Story = {
  parameters: { msw: { handlers: [respondError("get", PROFILE, { status: 500, code: "internal_error", message: "Internal server error" })] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Something went wrong on our side");
  },
};

/** Saved after the server confirms. */
export const Saved: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Save profile" }));
    await expect(await canvas.findByText("Profile saved.")).toBeInTheDocument();
  },
};

/** Another mentor's profile cannot be edited (403, spec E01 Phase 2) – shown as a form-level error. */
export const Forbidden: Story = {
  parameters: {
    msw: { handlers: [respondOk("get", PROFILE, mentorProfile), respondError("put", PROFILE, { status: 403, code: "forbidden", message: "You can only edit your own profile." })] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: "Save profile" }));
    const alert = await canvas.findByRole("alert");
    await expect(alert).toHaveTextContent("You can only edit your own profile.");
    await waitFor(() => expect(alert.parentElement).toHaveFocus());
  },
};

export const Narrow320: Story = { globals: { viewport: { value: "mobile320", isRotated: false } } };
