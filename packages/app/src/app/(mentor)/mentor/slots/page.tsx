import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../components/site-header";
import { SlotsManager } from "./slots-manager";

export const metadata: Metadata = {
  title: "Your times – DevMentor",
};

export default function MentorSlotsPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Your times" description="The times mentees can book. A time must start at least 24 hours from now.">
      <Suspense>
        <SlotsManager />
      </Suspense>
    </PageLayout>
  );
}
