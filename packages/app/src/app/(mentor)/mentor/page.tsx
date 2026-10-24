import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { createRequestScope } from "@devmentor/core";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { OfferChecklist, OfferChecklistSkeleton } from "@devmentor/ui/components/mentors/OfferChecklist";
import { SiteHeader } from "../../../components/site-header";
import { getSessionUser } from "../../../lib/session";

export const metadata: Metadata = {
  title: "Your offer – DevMentor",
};

// Phase 2 shows the profile and prices steps only; times and the share link arrive with their own pages.
async function Checklist() {
  await connection();
  const user = await getSessionUser();
  // The layout already refused everyone else; this keeps the page fail-closed on its own.
  if (user?.role !== "mentor") return null;
  const { mentorService } = (await createRequestScope()).cradle;
  const profile = await mentorService.getOrCreateOwn(user.id);

  return (
    <OfferChecklist
      show={["profile", "prices"]}
      profileComplete={Boolean(profile.name && profile.headline)}
      pricesSet={profile.price25 !== null && profile.price50 !== null}
      bookableSlots={0}
      slotsTooSoon={0}
      shareUrl=""
      listed={profile.listed}
      hrefs={{ profile: "/mentor/profile", slots: "/mentor/slots" }}
    />
  );
}

export default function MentorPage() {
  return (
    <PageLayout header={<SiteHeader />} title="Your offer" description="What is left before mentees can book you.">
      <Suspense fallback={<OfferChecklistSkeleton />}>
        <Checklist />
      </Suspense>
    </PageLayout>
  );
}
