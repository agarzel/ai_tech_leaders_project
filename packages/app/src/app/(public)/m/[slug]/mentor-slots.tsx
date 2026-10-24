"use client";

import { useSyncExternalStore } from "react";
import { SlotList, type Slot } from "@devmentor/ui/components/availability/SlotList";
import { Button } from "@devmentor/ui/components/ui/button";
import { formatTime } from "@devmentor/ui/lib/format";
import { browserTimeZone } from "@devmentor/ui/lib/time";

const subscribeNever = () => () => undefined;

/** The bookable times in the viewer's zone. *Book* is a disabled placeholder until payments exist (#30). */
export function MentorSlots({ slots }: { slots: Slot[] }) {
  const timeZone = useSyncExternalStore(subscribeNever, browserTimeZone, () => "UTC");

  return (
    <div className="flex flex-col gap-in-group">
      <SlotList
        slots={slots}
        timeZone={timeZone}
        showStatus={false}
        headingLevel={3}
        rowActions={(slot) => (
          <Button disabled aria-label={`Book ${formatTime(slot.startsAt, timeZone)}`}>
            Book
          </Button>
        )}
      />
      {slots.length > 0 && <p className="type-meta text-muted-foreground">Booking opens soon. For now you can see the prices and the times.</p>}
    </div>
  );
}
