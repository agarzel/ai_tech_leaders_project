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
  // Computed from the wall-clock parts, not from Intl's zone name: the name for a zero offset differs
  // between Node/ICU versions ("GMT" locally, "GMT+00:00" in CI).
  const offset = utcOffsetMinutes(timeZone, at);
  if (offset === 0) return "UTC";
  const sign = offset > 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `UTC${sign}${hours}${minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`}`;
}

/** Minutes the zone is ahead of UTC at the given moment (DST-aware). */
function utcOffsetMinutes(timeZone: string, at: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((part) => [part.type, part.value]),
  );
  const wallClockAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  const atMinute = Math.floor(at.getTime() / 60_000) * 60_000;
  return Math.round((wallClockAsUtc - atMinute) / 60_000);
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

/**
 * Reads a price typed in major units into minor units (grosze): "180" → 18000, "180.5" / "180,50" → 18050,
 * "1 200" → 120000; "" → `null` (not set). Anything else – more than two decimals, letters, a minus – →
 * `NaN`, so the form can say what to type. A comma is a decimal mark (Polish habit), not a thousands
 * separator (C41).
 */
export function parsePrice(text: string): number | null {
  const normalized = text.replace(/[\s ]/g, "").replace(",", ".");
  if (normalized === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return Math.round(Number(normalized) * 100);
}

/** A stored price back into the field: 18000 → "180.00", `null` → "". */
export function formatPriceInput(minor: number | null): string {
  return minor === null ? "" : (minor / 100).toFixed(2);
}

/** Day heading for lists grouped by day, in the viewer's zone: "Wednesday 4 November" (C5). */
export function formatDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(iso));
}

/** Time of day in the viewer's zone, 24-hour clock: "18:00". */
export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(new Date(iso));
}

/** The calendar day of an instant in a zone, "2026-11-04" – the key for grouping by local day. */
export function localDayKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(new Date(iso));
}
