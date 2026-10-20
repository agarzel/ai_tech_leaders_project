import { useEffect, useState } from "react";

/**
 * The current time as React state, refreshed on an interval (default: every minute, C12). Countdowns such
 * as `AcceptDeadline` get `now` from here, never tick by the second (P10, calm). A `start` fixes the first
 * reading – stories and tests stay deterministic – and time then runs on from it by the real clock.
 */
export function useNow(start?: Date, intervalMs = 60_000): Date {
  const [origin] = useState(() => ({ wall: Date.now(), start: (start ?? new Date()).getTime() }));
  const [now, setNow] = useState(() => new Date(origin.start));

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date(origin.start + Date.now() - origin.wall)), intervalMs);
    return () => clearInterval(timer);
  }, [origin, intervalMs]);

  return now;
}
