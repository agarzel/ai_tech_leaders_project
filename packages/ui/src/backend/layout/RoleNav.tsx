import { navLinkClassName, renderAnchor, type RenderLink } from "./links";

export type RoleNavItem = { label: string; href: string };

type RoleNavProps = {
  /** The fixed, short list for the signed-in role – only places that exist (R02.6/P12; audit: no "Coming soon"). */
  items: RoleNavItem[];
  /** `href` of the current item (exact match); it gets `aria-current="page"`. */
  currentHref?: string;
  /** Accessible name of the landmark. */
  label?: string;
  renderLink?: RenderLink;
  className?: string;
};

/** Short navigation for one role: a few fixed links, the current one marked (R02.6, P12). */
export function RoleNav({ items, currentHref, label = "Main", renderLink = renderAnchor, className }: RoleNavProps) {
  if (items.length === 0) return null;
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex flex-wrap items-center gap-in-group">
        {items.map((item) => (
          <li key={item.href}>
            {renderLink({
              href: item.href,
              className: navLinkClassName,
              "aria-current": item.href === currentHref ? "page" : undefined,
              children: item.label,
            })}
          </li>
        ))}
      </ul>
    </nav>
  );
}
