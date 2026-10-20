import { renderAnchor, type RenderLink } from "@devmentor/ui/backend/layout/links";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@devmentor/ui/components/ui/item";
import { formatDateTime, formatPrice, formatZoneLabel } from "@devmentor/ui/lib/format";
import { BookingStatusBadge } from "./BookingStatusBadge";
import type { Booking } from "./types";

type BookingRowProps = {
  booking: Booking;
  /** `/bookings/[id]`. */
  href: string;
  timeZone: string;
  renderLink?: RenderLink;
};

/**
 * A booking in the mentee's list (`/bookings`, spec E02): title – the mentor and the length – one
 * metadata line with the time, zone and price, and the status as words on the right (R01.1, R01.5).
 * The row is one link; no accent, because the rows are equal (T10).
 */
export function BookingRow({ booking, href, timeZone, renderLink = renderAnchor }: BookingRowProps) {
  const zone = formatZoneLabel(timeZone, new Date(booking.startsAt));
  return (
    <Item className="flex-wrap">
      <ItemContent className="min-w-0 basis-64">
        <ItemTitle>
          {renderLink({
            href,
            title: booking.mentor.name,
            "data-slot": "item-link",
            className: "outline-none after:absolute after:inset-0 hover:underline hover:underline-offset-4",
            children: `${booking.mentor.name} · ${booking.lengthMinutes} min`,
          })}
        </ItemTitle>
        <ItemDescription>
          {formatDateTime(booking.startsAt, timeZone)} ({zone}) · <span className="tabular-nums">{formatPrice(booking.priceAmount, booking.currency)}</span>
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <BookingStatusBadge status={booking.status} paymentStatus={booking.paymentStatus} />
      </ItemActions>
    </Item>
  );
}
