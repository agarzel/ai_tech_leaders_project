import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { canReadThread, createRequestScope, isMessagingOpen } from "@devmentor/core";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../components/site-header";
import { isNotFound, requireUser } from "../../../../lib/require-user";
import { BookingDetail } from "./booking-detail";

export const metadata: Metadata = {
  title: "Your booking – DevMentor",
};

async function Gate({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const user = await requireUser(`/bookings/${encodeURIComponent(id)}`);
  const { bookingQueryService, sessionThreadService } = (await createRequestScope()).cradle;
  let booking;
  try {
    booking = await bookingQueryService.getForMentee(user.id, id);
  } catch (error) {
    // Another person's booking answers like a missing one.
    if (isNotFound(error)) notFound();
    throw error;
  }
  const now = new Date();
  const startsAt = new Date(booking.startsAt);
  const confirmed = booking.status === "confirmed";
  // The thread is shown while it can be read; the composer only inside the session window.
  const thread =
    confirmed && canReadThread(startsAt, booking.lengthMinutes, now)
      ? {
          messages: await sessionThreadService.list(id, user.id),
          canWrite: isMessagingOpen(startsAt, booking.lengthMinutes, now),
        }
      : undefined;
  return <BookingDetail initial={booking} viewerId={user.id} thread={thread} />;
}

export default function BookingPage(props: PageProps<"/bookings/[id]">) {
  return (
    <PageLayout header={<SiteHeader />} title="Your booking">
      <Suspense fallback={<LoadingMessage />}>
        <Gate params={props.params} />
      </Suspense>
    </PageLayout>
  );
}
