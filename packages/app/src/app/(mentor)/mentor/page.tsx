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

// Phase 3 shows profile, prices and times; the share link and the public list arrive with phase 4.
async function Checklist() {
  await connection();
  const user = await getSessionUser();
  // The layout already refused everyone else; this keeps the page fail-closed on its own.
  if (user?.role !== "mentor") return null;
  const { mentorService, slotService } = (await createRequestScope()).cradle;
  const profile = await mentorService.getOrCreateOwn(user.id);
  // `bookable` is the server's own rule (open and at least 24 h ahead); the checklist never recomputes it.
  const slots = await slotService.listForOwner(user.id);
  const bookableSlots = slots.filter((slot) => slot.bookable).length;
  const slotsTooSoon = slots.filter((slot) => slot.status === "open" && !slot.bookable && new Date(slot.startsAt) > new Date()).length;

  return (
    <OfferChecklist
      show={["profile", "prices", "slots"]}
      profileComplete={Boolean(profile.name && profile.headline)}
      pricesSet={profile.price25 !== null && profile.price50 !== null}
      bookableSlots={bookableSlots}
      slotsTooSoon={slotsTooSoon}
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
