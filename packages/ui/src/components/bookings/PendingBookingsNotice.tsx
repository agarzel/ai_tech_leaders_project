import { renderAnchor, type RenderLink } from "@devmentor/ui/backend/layout/links";
import { buttonVariants } from "@devmentor/ui/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@devmentor/ui/components/ui/item";
import { AcceptDeadline } from "./AcceptDeadline";

type PendingBookingsNoticeProps = {
  /** Bookings awaiting the mentor's decision; none → nothing is rendered. */
  count: number;
  /** The nearest `acceptBy` among them. */
  earliestAcceptBy: string;
  /** `/mentor/bookings`. */
  href: string;
  now: Date;
  timeZone: string;
  /** The link is the accent; turn it off when the page already has another next action (one accent, P5/K3). */
  emphasis?: boolean;
  renderLink?: RenderLink;
};

/**
 * The *Pending* item on `/mentor` (spec E02, UI/UX; D15, P10): one row with the count in a sentence – a
 * number in words is allowed, a counter badge is not (Q2) – the nearest deadline and a link to decide.
 * It is the only in-app signal of new bookings (mentors get no email, D15).
 */
export function PendingBookingsNotice({ count, earliestAcceptBy, href, now, timeZone, emphasis = true, renderLink = renderAnchor }: PendingBookingsNoticeProps) {
  if (count === 0) return null;
  return (
    <ItemGroup aria-label="Bookings waiting for you">
      <Item className="flex-wrap">
        <ItemContent className="min-w-0 basis-64">
          <ItemTitle>{count === 1 ? "1 booking waiting for your decision" : `${count} bookings waiting for your decision`}</ItemTitle>
          <ItemDescription>
            <AcceptDeadline acceptBy={earliestAcceptBy} now={now} timeZone={timeZone} />
          </ItemDescription>
        </ItemContent>
        <ItemActions>{renderLink({ href, className: buttonVariants({ variant: emphasis ? "default" : "outline" }), children: "Review bookings" })}</ItemActions>
      </Item>
    </ItemGroup>
  );
}
