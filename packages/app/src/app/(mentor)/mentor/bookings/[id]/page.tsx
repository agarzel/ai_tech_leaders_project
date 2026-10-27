import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { canReadThread, createRequestScope, isMessagingOpen, sessionEndsAt } from "@devmentor/core";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { SiteHeader } from "../../../../../components/site-header";
import { isNotFound, requireUser } from "../../../../../lib/require-user";
import { MentorBookingDetail } from "./mentor-booking-detail";

export const metadata: Metadata = {
  title: "Session – DevMentor",
};

async function Gate({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const user = await requireUser(`/mentor/bookings/${encodeURIComponent(id)}`);
  const { bookingQueryService, sessionThreadService, sessionNoteService } = (await createRequestScope()).cradle;
  let booking;
  try {
    booking = await bookingQueryService.getForMentor(user.id, id);
  } catch (error) {
    // Another mentor's booking answers like a missing one.
    if (isNotFound(error)) notFound();
    throw error;
  }
  const now = new Date();
  const startsAt = new Date(booking.startsAt);
  const confirmed = booking.status === "confirmed";
  // The thread and the note exist only for a confirmed booking; the composer and the note editor follow the session times.
  const thread =
    confirmed && canReadThread(startsAt, booking.lengthMinutes, now)
      ? {
          messages: await sessionThreadService.list(id, user.id),
          canWrite: isMessagingOpen(startsAt, booking.lengthMinutes, now),
        }
      : undefined;
  const note = confirmed ? await sessionNoteService.readForMentor(id, user.id) : null;
  const canWriteNote = confirmed && now >= sessionEndsAt(startsAt, booking.lengthMinutes) && (note === null || note.status === "draft");
  return <MentorBookingDetail booking={booking} viewerId={user.id} thread={thread} note={note} canWriteNote={canWriteNote} />;
}

export default function MentorBookingPage(props: PageProps<"/mentor/bookings/[id]">) {
  return (
    <PageLayout header={<SiteHeader />} title="Session">
      <Suspense fallback={<LoadingMessage />}>
        <Gate params={props.params} />
      </Suspense>
    </PageLayout>
  );
}
