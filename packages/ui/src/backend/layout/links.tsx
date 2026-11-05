import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * One focus and hover style for every navigation link – the same neutral ring as buttons and fields
 * (T4), a 28 px target (40 px on touch, P4) and a muted background for hover and the current page.
 * Audit 2026-10-19: links showed the browser outline, buttons the design-system ring.
 * A label never wraps inside the link (issue 137: "My bookings" broke onto two lines at 375 px); when the row
 * is full, the whole link moves to the next line of the wrapping header.
 */
export const navLinkClassName =
  "inline-flex h-control-sm items-center whitespace-nowrap rounded-lg px-2 type-label text-muted-foreground outline-none transition-colors motion-reduce:transition-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:text-foreground";

/**
 * Whether a navigation link points at the current page: the same path, or a page below it
 * (`/bookings` is current on `/bookings/123`). `/bookings` is not current on `/mentor/bookings`.
 */
export function isCurrentNavHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children?: ReactNode;
  /** Lets a row link opt in to the dense list row styles (`data-slot="item-link"`). */
  "data-slot"?: string;
};

/**
 * Renders a link. The app passes Next.js `Link` (`renderLink={(props) => <Link {...props} />}`), because
 * ui must not import `next` (C29); stories and tests use a plain `<a>`.
 */
export type RenderLink = (props: LinkProps) => ReactNode;

export const renderAnchor: RenderLink = (props) => <a {...props} />;
