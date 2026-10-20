import { renderAnchor, type RenderLink } from "@devmentor/ui/backend/layout/links";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@devmentor/ui/components/ui/item";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";
import { formatDateTime, formatZoneLabel } from "@devmentor/ui/lib/format";
import { PriceList } from "./PriceList";
import { PublicWorkLinks } from "./PublicWorkLinks";
import { TagList } from "./TagList";
import type { PublicMentor } from "./types";

type MentorCardProps = {
  mentor: PublicMentor;
  /** The share page, `/m/[slug]`. */
  href: string;
  /** The viewer's zone, for the soonest slot. */
  timeZone: string;
  renderLink?: RenderLink;
};

/**
 * A mentor in the public list (spec E01, `/mentors`) as one dense row of a single-column list – name as
 * the row link, one line for the headline, stack tags, public-work links and the soonest time under it,
 * both prices on the right (C6, R01.1, R01.3). No avatar, no card grid, no ratings (A01, A05, N02). The
 * name stays `MentorCard` after the spec. Missing parts are simply not rendered (C42).
 */
export function MentorCard({ mentor, href, timeZone, renderLink = renderAnchor }: MentorCardProps) {
  return (
    <Item className="flex-wrap items-start">
      <ItemContent className="min-w-0 basis-64 gap-in-group">
        <ItemTitle>
          {renderLink({
            href,
            title: mentor.name,
            "data-slot": "item-link",
            className: "outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-4",
            children: mentor.name,
          })}
        </ItemTitle>
        {mentor.headline && <ItemDescription title={mentor.headline}>{mentor.headline}</ItemDescription>}
        {/* Above the stretched row link, so tags are readable and the work links stay clickable. */}
        <div className="relative flex flex-col gap-in-group">
          <TagList tags={mentor.tags} label={`Stack of ${mentor.name}`} />
          <PublicWorkLinks links={mentor.links} label={`Public work of ${mentor.name}`} inline />
        </div>
        {mentor.soonestSlotAt && (
          <p className="type-meta text-muted-foreground">
            Next time: {formatDateTime(mentor.soonestSlotAt, timeZone)} ({formatZoneLabel(timeZone, new Date(mentor.soonestSlotAt))})
          </p>
        )}
      </ItemContent>
      <ItemActions>
        <PriceList price25={mentor.price25} price50={mentor.price50} currency={mentor.currency} />
      </ItemActions>
    </Item>
  );
}

/** Placeholder rows while the list loads (C3). */
export function MentorCardSkeleton() {
  return (
    <div className="flex flex-col gap-in-group" role="status" aria-label="Loading mentors">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
