import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createRequestScope } from "@devmentor/core";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { MentorProfileHeader } from "@devmentor/ui/components/mentors/MentorProfileHeader";
import { PriceList } from "@devmentor/ui/components/mentors/PriceList";
import { SiteHeader } from "../../../../components/site-header";
import { isNotFound } from "../../../../lib/require-user";
import { getSessionUser } from "../../../../lib/session";
import { toPublicMentor } from "../../../../lib/public-mentor";
import { MentorSlots } from "./mentor-slots";

export const metadata: Metadata = {
  title: "Mentor – DevMentor",
};

// The lookup runs before anything streams: notFound() inside a Suspense boundary would answer 200, not 404.
// A blocking route for the same reason as the fake checkout page: the lookup is not cached and cannot sit inside Suspense.
export const instant = false;

export default async function MentorSharePage(props: PageProps<"/m/[slug]">) {
  await connection();
  const { slug } = await props.params;
  // `?from=list` comes from the public list; anything else is a share link.
  const entryPoint = (await props.searchParams).from === "list" ? "list" : "link";
  const user = await getSessionUser();
  const { mentorService } = (await createRequestScope()).cradle;
  let detail;
  try {
    detail = await mentorService.getPublicBySlug(slug);
  } catch (error) {
    // An unknown slug answers like a missing page: 404.
    if (isNotFound(error)) notFound();
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
