import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Suspense } from "react";
import { createRequestScope } from "@devmentor/core";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { OfferChecklist, OfferChecklistSkeleton } from "@devmentor/ui/components/mentors/OfferChecklist";
import { SiteHeader } from "../../../components/site-header";
import { getSessionUser } from "../../../lib/session";
import { PendingNotice } from "./pending-notice";

export const metadata: Metadata = {
  title: "Your offer – DevMentor",
};

async function Checklist() {
  await connection();
  const user = await getSessionUser();
  // The layout already refused everyone else; this keeps the page fail-closed on its own.
  if (user?.role !== "mentor") return null;
  const { bookingQueryService, mentorService, slotService } = (await createRequestScope()).cradle;
  const profile = await mentorService.getOrCreateOwn(user.id);
  // The public link is built from the request origin, like the invitation link; no env var.
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (/^(localhost|127\.0\.0\.1)/.test(host ?? "") ? "http" : "https");
  const shareUrl = `${protocol}://${host}/m/${profile.shareSlug}`;
  // `bookable` is the server's own rule (open and at least 24 h ahead); the checklist never recomputes it.
  const slots = await slotService.listForOwner(user.id);
  const bookableSlots = slots.filter((slot) => slot.bookable).length;
  const slotsTooSoon = slots.filter((slot) => slot.status === "open" && !slot.bookable && new Date(slot.startsAt) > new Date()).length;

  // `pendingCount` covers all bookings waiting for this mentor, not just one page of them.
  const { pendingCount, earliestAcceptBy } = await bookingQueryService.listForMentor(user.id, { page: 1, pageSize: 1 });

  return (
    <div className="flex flex-col gap-section">
      {earliestAcceptBy && <PendingNotice count={pendingCount} earliestAcceptBy={earliestAcceptBy} />}
      <OfferChecklist
        profileComplete={Boolean(profile.name && profile.headline)}
        pricesSet={profile.price25 !== null && profile.price50 !== null}
        bookableSlots={bookableSlots}
        slotsTooSoon={slotsTooSoon}
        shareUrl={shareUrl}
        listed={profile.listed}
        hrefs={{ profile: "/mentor/profile", slots: "/mentor/slots" }}
      />
    </div>
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
