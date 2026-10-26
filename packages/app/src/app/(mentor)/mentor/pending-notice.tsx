"use client";

import { PendingBookingsNotice } from "@devmentor/ui/components/bookings/PendingBookingsNotice";
import { useNow } from "@devmentor/ui/lib/useNow";
import { renderNextLink } from "../../../components/render-next-link";
import { useTimeZone } from "../../../lib/use-time-zone";

/** The *Pending* item on `/mentor`: how many bookings wait for a decision and the nearest deadline. */
export function PendingNotice({ count, earliestAcceptBy }: { count: number; earliestAcceptBy: string }) {
  const timeZone = useTimeZone();
  const now = useNow();
  if (!timeZone) return null;
  return <PendingBookingsNotice count={count} earliestAcceptBy={earliestAcceptBy} href="/mentor/bookings" now={now} timeZone={timeZone} renderLink={renderNextLink} />;
}
