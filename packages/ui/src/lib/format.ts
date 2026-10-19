// Display formats for money, dates and time zones (POSTEP.md stage 3: C4, C5, C12).
// Pure functions: the caller passes the time zone and "now", so stories and tests are deterministic and
// the UI never decides domain rules – it only formats values that arrive in DTOs (spec E01, "Where the UI
// gets domain values").

/**
 * A price in minor units (grosze) with its ISO currency code: `formatPrice(18000, "PLN")` → "PLN 180.00".
 * The code and the amount are joined by a no-break space, so they never wrap apart (C4, D12, F6).
 */
export function formatPrice(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" }).format(minor / 100);
}

/** Date and time in the viewer's zone, 24-hour clock: "Wed 4 Nov, 18:00" (C5). */
export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso));
}

/** The zone label shown next to every time: "Europe/Warsaw, UTC+1" (spec E01 Edge Cases, C5). */
export function formatZoneLabel(timeZone: string, at: Date): string {
  return `${timeZone}, ${formatUtcOffset(timeZone, at)}`;
}

/** "UTC", "UTC+1", "UTC+5:30", "UTC-3" – the zone's offset at the given moment (DST-aware). */
export function formatUtcOffset(timeZone: string, at: Date): string {
  const name = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(at)
    .filter((part) => part.type === "timeZoneName")
    .map((part) => part.value)
    .join("");
  // "GMT" for a zero offset, otherwise "GMT+01:00" / "GMT-03:00" / "GMT+05:30".
  const match = name.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!match) return "UTC";
  const [, sign, hours, minutes] = match;
  return `UTC${sign}${Number(hours)}${minutes === "00" ? "" : `:${minutes}`}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Short relative time from `now`: "in 45 min", "in 9 h", "in 3 days", "20 min ago", "now" (C12).
 * Rounded down, so a deadline never looks further away than it is.
 */
export function formatRelative(iso: string, now: Date): string {
  const diff = new Date(iso).getTime() - now.getTime();
  const distance = Math.abs(diff);
  if (distance < MINUTE) return "now";
  const amount =
    distance < HOUR
      ? `${Math.floor(distance / MINUTE)} min`
      : distance < 2 * DAY
        ? `${Math.floor(distance / HOUR)} h`
        : `${Math.floor(distance / DAY)} days`;
  return diff > 0 ? `in ${amount}` : `${amount} ago`;
}
