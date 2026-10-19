// Local date-time ↔ UTC for slot entry (spec E01, Edge Cases "Time zones and DST").
// The browser converts the mentor's local date and time to an ISO UTC string in the browser's zone; the
// server stores UTC and has no zone logic. Intl only – no date library (rule 6).

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

export type LocalToUtcResult =
  | {
      ok: true;
      /** ISO UTC string to send to the API. */
      iso: string;
      /** The local time happens twice (fall-back hour); `iso` is the first occurrence – preview it with its offset. */
      ambiguous: boolean;
    }
  | {
      ok: false;
      /** `invalid`: not a real date or time; `nonexistent`: skipped by a spring-forward change in this zone. */
      reason: "invalid" | "nonexistent";
    };

/** The viewer's IANA time zone, e.g. "Europe/Warsaw" (spec E01: shown on the slot form). */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Converts a local date (`YYYY-MM-DD`) and time (`HH:MM`) in `timeZone` to UTC. Each candidate is
 * converted back (round trip): no match means the time does not exist there (refuse with "This time
 * does not exist in your time zone"); two matches mean it is ambiguous and the first one is used.
 */
export function localToUtc(date: string, time: string, timeZone: string): LocalToUtcResult {
  const wall = Date.parse(`${date}T${time}:00Z`);
  // Rejects malformed input and overflow such as 2026-02-30 or 24:00 (the parse would roll them over).
  if (Number.isNaN(wall) || new Date(wall).toISOString().slice(0, 16) !== `${date}T${time}`) {
    return { ok: false, reason: "invalid" };
  }

  // The zone's offsets a day before and after cover both sides of a DST change near this time.
  const offsets = new Set([offsetAt(wall - DAY, timeZone), offsetAt(wall + DAY, timeZone)]);
  const candidates = [...offsets]
    .map((offset) => wall - offset)
    .filter((utc) => wallClockAt(utc, timeZone) === wall)
    .sort((a, b) => a - b);

  if (candidates.length === 0) return { ok: false, reason: "nonexistent" };
  return { ok: true, iso: new Date(candidates[0]).toISOString(), ambiguous: candidates.length > 1 };
}

/** The zone's offset from UTC at an instant, in milliseconds (UTC+1 → 3,600,000). */
export function offsetAt(utc: number, timeZone: string): number {
  return wallClockAt(utc, timeZone) - Math.floor(utc / MINUTE) * MINUTE;
}

/** The wall-clock reading in `timeZone` at instant `utc`, expressed as if it were a UTC timestamp (minute precision). */
function wallClockAt(utc: number, timeZone: string): number {
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
      .formatToParts(utc)
      .map((part) => [part.type, part.value]),
  );
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
}
