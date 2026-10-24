"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { SlotDto } from "@devmentor/core";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { AddSlotForm } from "@devmentor/ui/components/availability/AddSlotForm";
import { DeleteSlotDialog } from "@devmentor/ui/components/availability/DeleteSlotDialog";
import { SlotList } from "@devmentor/ui/components/availability/SlotList";
import { browserTimeZone } from "@devmentor/ui/lib/time";

const subscribeNever = () => () => undefined;

/** The mentor's own slots: list, add and delete through `/api/mentor/slots`, in the browser's time zone. */
export function SlotsManager() {
  // The zone is only known in the browser: the server snapshot is empty, so server and client markup stay equal.
  const timeZone = useSyncExternalStore(subscribeNever, browserTimeZone, () => undefined);
  const [slots, setSlots] = useState<SlotDto[]>();
  const [error, setError] = useState<ApiError | null>(null);
  // Bumped to load the list again (after an add, a delete or a retry).
  const [reloads, setReloads] = useState(0);
  const reload = () => setReloads((count) => count + 1);

  useEffect(() => {
    const controller = new AbortController();
    apiCall<SlotDto[]>("/api/mentor/slots", { signal: controller.signal })
      .then((result) => {
        setSlots(result.ok ? result.data : undefined);
        setError(result.ok ? null : result.error);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [reloads]);

  if (!timeZone) return <SlotList slots={undefined} timeZone="UTC" isLoading />;

  return (
    <div className="flex flex-col gap-section">
      <section aria-labelledby="add-slot-heading" className="flex flex-col gap-in-group">
        <h2 id="add-slot-heading" className="type-section-title">
          Add a time
        </h2>
        <AddSlotForm
          timeZone={timeZone}
          onSubmit={(startsAt) => apiCall<SlotDto>("/api/mentor/slots", { method: "POST", body: { startsAt } })}
          onAdded={reload}
        />
      </section>
      <section aria-labelledby="slots-heading" className="flex flex-col gap-in-group">
        <h2 id="slots-heading" className="type-section-title">
          Your times
        </h2>
        <SlotList
          slots={slots}
          timeZone={timeZone}
          headingLevel={3}
          error={error}
          onRetry={reload}
          emptyTitle="You have no times yet"
          emptyDescription="Add a time above so mentees can book you."
          rowActions={(slot) =>
            slot.status === "open" ? (
              <DeleteSlotDialog
                slot={slot}
                timeZone={timeZone}
                onConfirm={(target) => apiCall(`/api/mentor/slots/${target.id}`, { method: "DELETE" })}
                onDeleted={reload}
              />
            ) : null
          }
        />
      </section>
    </div>
  );
}
