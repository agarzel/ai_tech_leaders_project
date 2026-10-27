"use client";

import type { MentorBookingDto, MessageDto } from "@devmentor/core";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { BookingQuestion } from "@devmentor/ui/components/bookings/BookingQuestion";
import { SessionNoteEditor } from "@devmentor/ui/components/sessions/SessionNoteEditor";
import { SessionThread } from "@devmentor/ui/components/sessions/SessionThread";
import { formatDateTime } from "@devmentor/ui/lib/format";
import { useTimeZone } from "../../../../../lib/use-time-zone";

type MentorBookingDetailProps = {
  booking: MentorBookingDto;
  viewerId: string;
  thread?: { messages: MessageDto[]; canWrite: boolean };
  note: { status: "draft" | "approved" | "rejected"; body: string } | null;
  canWriteNote: boolean;
};

/** One of the mentor's bookings: the session time, the question, the thread and – for a confirmed booking – the note. */
export function MentorBookingDetail({ booking, viewerId, thread, note, canWriteNote }: MentorBookingDetailProps) {
  const timeZone = useTimeZone();
  if (!timeZone) return <LoadingMessage />;

  return (
    <div className="flex flex-col gap-section">
      <p className="text-muted-foreground">
        Session with {booking.mentee.name} · {formatDateTime(booking.startsAt, timeZone)}
      </p>
      <section aria-labelledby="question-heading" className="flex flex-col gap-in-group">
        <h2 id="question-heading" className="type-section-title">
          Question
        </h2>
        <BookingQuestion question={booking.question} />
      </section>
      {thread && (
        <SessionThread
          bookingId={booking.id}
          viewerId={viewerId}
          counterpartName={booking.mentee.name}
          timeZone={timeZone}
          messages={thread.messages}
          canWrite={thread.canWrite}
        />
      )}
      {booking.status === "confirmed" && <SessionNoteEditor bookingId={booking.id} note={note} canWrite={canWriteNote} />}
    </div>
  );
}
