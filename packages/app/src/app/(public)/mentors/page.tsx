import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { MENTOR_TAGS, createRequestScope, parseOrThrow } from "@devmentor/core";
import { publicMentorQuerySchema } from "@devmentor/core/validators/mentors/public-mentor-query.schema";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { navLinkClassName } from "@devmentor/ui/backend/layout/links";
import { MentorCardSkeleton } from "@devmentor/ui/components/mentors/MentorCard";
import { SiteHeader } from "../../../components/site-header";
import { toPublicMentor } from "../../../lib/public-mentor";
import { MentorList } from "./mentor-list";

export const metadata: Metadata = {
  title: "Mentors – DevMentor",
};

async function Mentors({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const raw = await searchParams;
  // An unknown tag in the address is ignored here (the page stays usable); the API itself rejects it.
  const tag = typeof raw.tag === "string" && (MENTOR_TAGS as readonly string[]).includes(raw.tag) ? raw.tag : undefined;
  const query = parseOrThrow(publicMentorQuerySchema, { tag });
  const { mentorService } = (await createRequestScope()).cradle;
  const page = await mentorService.listPublic(query);

  return (
    <div className="flex flex-col gap-between-groups">
      <nav aria-label="Filter by tag" className="flex flex-wrap gap-in-group">
        <Link href="/mentors" className={navLinkClassName} aria-current={tag ? undefined : "page"}>
          All
        </Link>
        {MENTOR_TAGS.map((option) => (
          <Link key={option} href={`/mentors?tag=${encodeURIComponent(option)}`} className={navLinkClassName} aria-current={tag === option ? "page" : undefined}>
            {option}
          </Link>
        ))}
      </nav>
      <MentorList mentors={page.items.map(toPublicMentor)} filtered={Boolean(tag)} />
    </div>
  );
}

export default function MentorsPage(props: PageProps<"/mentors">) {
  return (
    <PageLayout header={<SiteHeader />} title="Mentors" description="Experienced developers you can book for one problem. Prices are shown up front.">
      <Suspense fallback={<MentorCardSkeleton />}>
        <Mentors searchParams={props.searchParams} />
      </Suspense>
    </PageLayout>
  );
}
