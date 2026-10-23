import type { Metadata } from "next";
import { Suspense } from "react";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../components/site-header";
import { MentorRegisterForm } from "./mentor-register-form";

export const metadata: Metadata = {
  title: "Create mentor account – DevMentor",
};

export default function MentorRegisterPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Create mentor account" description="You were invited to mentor on DevMentor." width="narrow">
      <Suspense>
        <MentorRegisterForm />
      </Suspense>
    </PageLayout>
  );
}
