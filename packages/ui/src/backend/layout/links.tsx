import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * One focus and hover style for every navigation link – the same neutral ring as buttons and fields
 * (T4), a 28 px target (40 px on touch, P4) and a muted background for hover and the current page.
 * Audit 2026-10-19: links showed the browser outline, buttons the design-system ring.
 */
export const navLinkClassName =
  "inline-flex h-control-sm items-center rounded-lg px-2 type-label text-muted-foreground outline-none transition-colors motion-reduce:transition-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-muted aria-[current=page]:text-foreground";

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode };

/**
 * Renders a link. The app passes Next.js `Link` (`renderLink={(props) => <Link {...props} />}`), because
 * ui must not import `next` (C29); stories and tests use a plain `<a>`.
 */
export type RenderLink = (props: LinkProps) => ReactNode;

export const renderAnchor: RenderLink = (props) => <a {...props} />;
