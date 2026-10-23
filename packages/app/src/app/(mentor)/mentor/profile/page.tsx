import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../components/site-header";
import { ProfileEditor } from "./profile-editor";

export const metadata: Metadata = {
  title: "Profile and prices – DevMentor",
};

export default function MentorProfilePage() {
  return (
    <PageLayout header={<SiteHeader />} title="Profile and prices" description="What mentees see about you, and what a session costs.">
      <Suspense>
        <ProfileEditor />
      </Suspense>
    </PageLayout>
  );
}
