"use client";

import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { BookingForm, type BookingStarted } from "@devmentor/ui/components/bookings/BookingForm";
import { useTimeZone } from "../../../../lib/use-time-zone";

type BookFlowProps = {
  slotId: string;
  startsAt: string;
  mentorName: string;
  lengthMinutes: 25 | 50;
  /** Grosze, read by the server; the booking API computes the price again and never trusts this one. */
  priceAmount: number;
  currency: string;
  entryPoint: "link" | "list" | "unknown";
};

/** The booking form in the viewer's zone: creates the booking, then leaves for the provider's payment page. */
export function BookFlow({ slotId, startsAt, mentorName, lengthMinutes, priceAmount, currency, entryPoint }: BookFlowProps) {
  const timeZone = useTimeZone();
  if (!timeZone) return <LoadingMessage />;

  return (
    <BookingForm
      summary={{ mentorName, startsAt, lengthMinutes, priceAmount, currency, timeZone }}
      onSubmit={({ question }) => apiCall<BookingStarted>("/api/bookings", { method: "POST", body: { slotId, lengthMinutes, question, entryPoint } })}
      onStarted={({ checkoutUrl }) => window.location.assign(checkoutUrl)}
    />
  );
}
