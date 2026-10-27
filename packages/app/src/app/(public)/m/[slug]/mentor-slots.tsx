"use client";

import { SlotList, type Slot } from "@devmentor/ui/components/availability/SlotList";
import { SlotBookActions } from "@devmentor/ui/components/bookings/SlotBookActions";
import { formatDateTime } from "@devmentor/ui/lib/format";
import { loginPathFor } from "../../../../lib/return-path";
import { renderNextLink } from "../../../../components/render-next-link";
import { useTimeZone } from "../../../../lib/use-time-zone";

type MentorSlotsProps = {
  slots: Slot[];
  price25: number | null;
  price50: number | null;
  currency: string;
  /** How the visitor reached this page (`link` or `list`); kept on the *Book* links so the booking records it. */
  entryPoint: "link" | "list";
  /** A signed-in visitor goes to the booking page, a guest to sign-in first (and back afterwards). */
  signedIn: boolean;
};

/** The bookable times in the viewer's zone, each with *Book 25 min* and *Book 50 min* and the price. */
export function MentorSlots({ slots, price25, price50, currency, entryPoint, signedIn }: MentorSlotsProps) {
  const timeZone = useTimeZone() ?? "UTC";

  return (
    <SlotList
      slots={slots}
      timeZone={timeZone}
      showStatus={false}
      headingLevel={3}
      rowActions={(slot) => (
        <SlotBookActions
          slotLabel={formatDateTime(slot.startsAt, timeZone)}
          price25={price25}
          price50={price50}
          currency={currency}
          renderLink={renderNextLink}
          hrefFor={(length) => {
            const bookPath = `/book/${slot.id}?length=${length}&from=${entryPoint}`;
            return signedIn ? bookPath : loginPathFor(bookPath);
          }}
        />
      )}
    />
  );
}
