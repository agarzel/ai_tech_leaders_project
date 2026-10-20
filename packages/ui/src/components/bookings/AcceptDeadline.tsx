import { ClockAlertIcon } from "lucide-react";
import { formatDateTime, formatRelative, formatZoneLabel } from "@devmentor/ui/lib/format";

const SOON_MS = 2 * 60 * 60 * 1000;

type AcceptDeadlineProps = {
  /** ISO UTC: `startsAt − 12 h` (R05), set once the booking is paid. */
  acceptBy: string;
  /** The page's clock, refreshed every minute (`useNow`) – never ticks by the second. */
  now: Date;
  timeZone: string;
};

/**
 * By when the mentor must decide (R05, D07; C12): the time with its zone and a relative phrase ("in 9 h").
 * Under two hours it adds the words "Decide soon" with an icon, so urgency is never only a colour or a
 * weight (WCAG 1.4.1); past the deadline it says "Deadline passed". Calm text, no countdown timer (P10).
 */
export function AcceptDeadline({ acceptBy, now, timeZone }: AcceptDeadlineProps) {
  const remaining = new Date(acceptBy).getTime() - now.getTime();
  const when = `${formatDateTime(acceptBy, timeZone)} (${formatZoneLabel(timeZone, new Date(acceptBy))})`;
  const relative = formatRelative(acceptBy, now);

  if (remaining <= 0) {
    return (
      <span>
        Deadline passed: <time dateTime={acceptBy}>{when}</time> · {relative}
      </span>
    );
  }
  return (
    <span>
      {remaining < SOON_MS && (
        <>
          <ClockAlertIcon aria-hidden="true" className="mr-1 inline size-3.5 align-text-bottom" />
          <strong className="font-medium text-foreground">Decide soon</strong> –{" "}
        </>
      )}
      Decide by <time dateTime={acceptBy}>{when}</time> · {relative}
    </span>
  );
}
