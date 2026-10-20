import { formatDateTime, formatPrice, formatZoneLabel } from "@devmentor/ui/lib/format";
import type { BookingLength } from "./types";

export type BookingSummaryProps = {
  mentorName: string;
  startsAt: string;
  lengthMinutes: BookingLength;
  /** Grosze, computed by the server – shown, never calculated here. */
  priceAmount: number;
  currency: string;
  timeZone: string;
};

/**
 * What is being bought, before paying (spec E02, UI/UX `/book/[slotId]`): mentor, the time in the
 * viewer's zone with its label, the length and the price – a description list, not a card (R01.1, R01.4).
 */
export function BookingSummary({ mentorName, startsAt, lengthMinutes, priceAmount, currency, timeZone }: BookingSummaryProps) {
  const rows = [
    ["Mentor", mentorName],
    ["When", `${formatDateTime(startsAt, timeZone)} (${formatZoneLabel(timeZone, new Date(startsAt))})`],
    ["Length", `${lengthMinutes} minutes`],
    ["Price", formatPrice(priceAmount, currency)],
  ] as const;
  return (
    <dl className="grid grid-cols-label-value gap-x-between-groups gap-y-in-group type-body">
      {rows.map(([term, value]) => (
        <div key={term} className="contents">
          <dt className="text-muted-foreground">{term}</dt>
          <dd className={term === "Price" ? "tabular-nums" : "min-w-0 break-words"}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
