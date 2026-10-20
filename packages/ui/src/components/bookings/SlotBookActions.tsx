import { Fragment } from "react";
import { renderAnchor, type RenderLink } from "@devmentor/ui/backend/layout/links";
import { buttonVariants } from "@devmentor/ui/components/ui/button";
import { formatPrice } from "@devmentor/ui/lib/format";
import type { BookingLength } from "./types";

type SlotBookActionsProps = {
  /** The slot in words, for the accessible names (rows repeat): "Thu 22 Oct, 18:00". */
  slotLabel: string;
  /** Grosze; `null` = not set – that length is not offered. */
  price25: number | null;
  price50: number | null;
  currency: string;
  /** Where *Book* leads for a length, e.g. `/book/{slotId}?length=25&from=list` (the page keeps `from`, spec E02). */
  hrefFor: (length: BookingLength) => string;
  /** The mentor looking at their own page: booking one's own slot is `forbidden` (spec E02). */
  isOwnSlot?: boolean;
  renderLink?: RenderLink;
};

/**
 * *Book 25 min · PLN 180.00* and *Book 50 min · PLN 320.00* on a slot row (spec E02, UI/UX `/m/[slug]`):
 * the price is part of the action, so it is known before anything is typed (R01.4). Equal choices, so
 * neither is the accent (Q3, C10). A length without a price is not offered.
 */
export function SlotBookActions({ slotLabel, price25, price50, currency, hrefFor, isOwnSlot = false, renderLink = renderAnchor }: SlotBookActionsProps) {
  if (isOwnSlot) return <span className="type-meta text-muted-foreground">Your own slot</span>;

  const offers = (
    [
      [25, price25],
      [50, price50],
    ] as const
  ).filter((offer): offer is readonly [BookingLength, number] => offer[1] !== null);

  if (offers.length === 0) return <span className="type-meta text-muted-foreground">No price set</span>;

  return (
    <div className="flex flex-wrap items-center gap-in-group">
      {offers.map(([length, price]) => {
        const text = `Book ${length} min · ${formatPrice(price, currency)}`;
        return (
          <Fragment key={length}>
            {renderLink({
              href: hrefFor(length),
              className: buttonVariants({ variant: "outline", size: "sm" }),
              "aria-label": `${text}, ${slotLabel}`,
              children: text,
            })}
          </Fragment>
        );
      })}
    </div>
  );
}
