import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../components/site-header";

export default function MentorNotFoundPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Mentor not found">
      <EmptyState title="This link does not lead to a mentor" description="Check the link or browse the list of mentors." />
    </PageLayout>
  );
}
