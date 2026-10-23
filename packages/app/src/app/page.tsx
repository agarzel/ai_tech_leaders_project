import { SiteHeader } from "../components/site-header";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";

export default function HomePage() {
  return (
    <PageLayout
      header={<SiteHeader />}
      title="Book a senior engineer for one problem"
      description="A paid text session of 25 or 50 minutes with an experienced developer, about one specific problem."
    >
      <section className="flex max-w-prose flex-col gap-in-group">
        <h2 className="type-section-title">How it works</h2>
        <p className="type-body text-muted-foreground">
          You write your question when you book. You pay for the session up front. The mentor&apos;s price for 25 and
          for 50 minutes is shown before you write the question.
        </p>
        <p className="type-body text-muted-foreground">
          The mentor list is not open yet.
        </p>
      </section>
    </PageLayout>
  );
}
