"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BookingDto, MessageDto } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { BookingQuestion } from "@devmentor/ui/components/bookings/BookingQuestion";
import { BookingStatusPanel } from "@devmentor/ui/components/bookings/BookingStatusPanel";
import { BookingSummary } from "@devmentor/ui/components/bookings/BookingSummary";
import type { PaymentPendingPhase } from "@devmentor/ui/components/bookings/PaymentPending";
import { SessionNotePanel } from "@devmentor/ui/components/sessions/SessionNotePanel";
import { SessionThread } from "@devmentor/ui/components/sessions/SessionThread";
import { buttonVariants } from "@devmentor/ui/components/ui/button";
import { useTimeZone } from "../../../../lib/use-time-zone";

/** After the payment page the webhook may still be on its way: re-check every few seconds, for about a minute. */
const POLL_INTERVAL_MS = 3_000;
const POLL_FOR_MS = 60_000;

const ENDED = ["declined", "expired", "payment_expired"];

/** A booking of the caller: status and next step, the summary and the question; follows the payment while it settles. */
export function BookingDetail({
  initial,
  viewerId,
  thread,
  note,
}: {
  initial: BookingDto;
  viewerId: string;
  /** Present while the thread can be read; `canWrite` only inside the session window. */
  thread?: { messages: MessageDto[]; canWrite: boolean };
  /** The mentor's note as the mentee may see it: a draft to decide on, or an approved note; null otherwise. */
  note: { status: "draft" | "approved" | "rejected"; body: string } | null;
}) {
  const timeZone = useTimeZone();
  const [booking, setBooking] = useState(initial);
  const [phase, setPhase] = useState<PaymentPendingPhase>("checking");
  const waiting = booking.status === "pending_payment";

  useEffect(() => {
    if (!waiting) return;
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started >= POLL_FOR_MS) {
        setPhase("slow");
        clearInterval(timer);
        return;
      }
      apiCall<BookingDto>(`/api/bookings/${initial.id}`).then((result) => {
        if (result.ok) setBooking(result.data);
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [waiting, initial.id]);

  if (!timeZone) return <LoadingMessage />;

  return (
    <div className="flex flex-col gap-section">
      <BookingStatusPanel
        booking={booking}
        audience="mentee"
        timeZone={timeZone}
        pendingPhase={phase}
        actions={
          ENDED.includes(booking.status) && (
            <Link href="/mentors" className={buttonVariants()}>
              Find another mentor
            </Link>
          )
        }
      />
      <section aria-labelledby="summary-heading" className="flex flex-col gap-in-group">
        <h2 id="summary-heading" className="type-section-title">
          Your booking
        </h2>
        <BookingSummary
          mentorName={booking.mentor.name}
          startsAt={booking.startsAt}
          lengthMinutes={booking.lengthMinutes}
          priceAmount={booking.priceAmount}
          currency={booking.currency}
          timeZone={timeZone}
        />
      </section>
      <section aria-labelledby="question-heading" className="flex flex-col gap-in-group">
        <h2 id="question-heading" className="type-section-title">
          Your question
        </h2>
        <BookingQuestion question={booking.question} />
      </section>
      {thread && (
        <SessionThread
          bookingId={booking.id}
          viewerId={viewerId}
          counterpartName={booking.mentor.name}
          timeZone={timeZone}
          messages={thread.messages}
          canWrite={thread.canWrite}
        />
      )}
      {note && <SessionNotePanel bookingId={booking.id} mentorName={booking.mentor.name} note={note} />}
    </div>
  );
}
