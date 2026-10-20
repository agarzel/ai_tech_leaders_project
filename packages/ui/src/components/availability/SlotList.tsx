import type { ReactNode } from "react";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { ErrorMessage } from "@devmentor/ui/backend/feedback/ErrorMessage";
import type { ApiError } from "@devmentor/ui/backend/api/types";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@devmentor/ui/components/ui/item";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";
import { formatDay, formatTime, formatZoneLabel, localDayKey } from "@devmentor/ui/lib/format";
import type { Slot } from "./types";

export type { Slot } from "./types";

type SlotRowProps = {
  slot: Slot;
  timeZone: string;
  /** Owner view: the status in words. Public view: only the zone label (every listed slot is open and bookable). */
  showStatus?: boolean;
  /** Actions on the row – *Delete* for the owner, *Book* for a mentee (they sit above any row link). */
  actions?: ReactNode;
};

/** What the owner needs to know about a slot, as words (WCAG 1.4.1): booked, too soon to be booked (D13), open. */
function statusText(slot: Slot): string {
  if (slot.status === "booked") return "Booked";
  return slot.bookable ? "Open for booking" : "Not bookable – starts too soon";
}

/** One slot: the time in the viewer's zone, then one metadata line with its status and the zone label (C5). */
export function SlotRow({ slot, timeZone, showStatus = true, actions }: SlotRowProps) {
  const zone = formatZoneLabel(timeZone, new Date(slot.startsAt));
  return (
    <Item>
      <ItemContent>
        <ItemTitle>
          <time dateTime={slot.startsAt} className="tabular-nums">
            {formatTime(slot.startsAt, timeZone)}
          </time>
        </ItemTitle>
        <ItemDescription>{showStatus ? `${statusText(slot)} · ${zone}` : zone}</ItemDescription>
      </ItemContent>
      {actions && <ItemActions>{actions}</ItemActions>}
    </Item>
  );
}

type SlotListProps = {
  slots: Slot[] | undefined;
  /** The viewer's zone; days and times are shown in it. */
  timeZone: string;
  showStatus?: boolean;
  /** Per-row actions; give each an accessible name that includes the time (rows repeat). */
  rowActions?: (slot: Slot) => ReactNode;
  /** Level of the day headings; the page's own section heading sits one level above. */
  headingLevel?: 2 | 3 | 4;
  isLoading?: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
};

/**
 * Slots grouped by the viewer's local day, earliest first (spec E01: `/mentor/slots` and `/m/[slug]`).
 * The owner sees every slot with its status; the public page passes only bookable ones. Loading, error
 * and empty are the list's own states (C3) – the empty text for a public page is "No times available
 * right now", an empty state and not an error (spec E01, Edge Cases).
 */
export function SlotList({
  slots,
  timeZone,
  showStatus = true,
  rowActions,
  headingLevel = 3,
  isLoading = false,
  error = null,
  onRetry,
  emptyTitle = "No times available right now",
  emptyDescription,
  emptyAction,
}: SlotListProps) {
  if (error) return <ErrorMessage title="Could not load the slots" error={error} onRetry={onRetry} />;
  if (isLoading || !slots) return <SlotListSkeleton />;
  if (slots.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;

  const days = new Map<string, Slot[]>();
  for (const slot of [...slots].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = localDayKey(slot.startsAt, timeZone);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }
  const Heading = `h${headingLevel}` as const;

  return (
    <div className="flex flex-col gap-between-groups">
      {[...days.entries()].map(([key, daySlots]) => (
        <section key={key} aria-labelledby={`slot-day-${key}`} className="flex flex-col gap-in-group">
          <Heading id={`slot-day-${key}`} className="type-label">
            {formatDay(daySlots[0].startsAt, timeZone)}
          </Heading>
          <ItemGroup aria-labelledby={`slot-day-${key}`}>
            {daySlots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} timeZone={timeZone} showStatus={showStatus} actions={rowActions?.(slot)} />
            ))}
          </ItemGroup>
        </section>
      ))}
    </div>
  );
}

/** Placeholder while the slots load (C3). */
export function SlotListSkeleton() {
  return (
    <div className="flex flex-col gap-in-group" role="status" aria-label="Loading slots">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
