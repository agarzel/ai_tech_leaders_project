import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createRequestScope } from "@devmentor/core";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { MentorProfileHeader, MentorProfileHeaderSkeleton } from "@devmentor/ui/components/mentors/MentorProfileHeader";
import { PriceList } from "@devmentor/ui/components/mentors/PriceList";
import { SiteHeader } from "../../../../components/site-header";
import { getSessionUser } from "../../../../lib/session";
import { toPublicMentor } from "../../../../lib/public-mentor";
import { MentorSlots } from "./mentor-slots";

export const metadata: Metadata = {
  title: "Mentor – DevMentor",
};

async function Mentor({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ from?: string | string[] }> }) {
  await connection();
  const { slug } = await params;
  // `?from=list` comes from the public list; anything else is a share link.
  const entryPoint = (await searchParams).from === "list" ? "list" : "link";
  const user = await getSessionUser();
  const { mentorService } = (await createRequestScope()).cradle;
  let detail;
  try {
    detail = await mentorService.getPublicBySlug(slug);
  } catch (error) {
    // Matched by name: the service's error class is not always the same instance in the page bundle (instanceof failed here).
    if (error instanceof Error && error.name === "NotFoundError") notFound();
    throw error;
  }
  const mentor = toPublicMentor(detail);

  return (
    <PageLayout header={<SiteHeader />} title={mentor.name}>
      <MentorProfileHeader mentor={mentor} />
      <section aria-labelledby="prices-heading" className="flex flex-col gap-in-group">
        <h2 id="prices-heading" className="type-section-title">
          Prices
        </h2>
        <PriceList price25={mentor.price25} price50={mentor.price50} currency={mentor.currency} />
      </section>
      <section aria-labelledby="times-heading" className="flex flex-col gap-in-group">
        <h2 id="times-heading" className="type-section-title">
          Available times
        </h2>
        <MentorSlots slots={detail.slots} price25={mentor.price25} price50={mentor.price50} currency={mentor.currency} entryPoint={entryPoint} signedIn={user !== null} />
      </section>
    </PageLayout>
  );
}

export default function MentorSharePage(props: PageProps<"/m/[slug]">) {
  return (
    <Suspense
      fallback={
        <PageLayout header={<SiteHeader />} title="Mentor">
          <MentorProfileHeaderSkeleton />
        </PageLayout>
      }
    >
      <Mentor params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
