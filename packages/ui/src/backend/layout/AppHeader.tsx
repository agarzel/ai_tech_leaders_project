import type { ReactNode } from "react";
import { cn } from "@devmentor/ui/lib/utils";
import { navLinkClassName, renderAnchor, type RenderLink } from "./links";
import { RoleNav, type RoleNavItem } from "./RoleNav";

type AppHeaderProps = {
  /** Where the word mark leads. */
  homeHref?: string;
  /** The role's short navigation (empty for visitors on sign-in pages). */
  nav?: RoleNavItem[];
  currentHref?: string;
  /** Accessible name of the navigation landmark. */
  navLabel?: string;
  /** Right side: `AccountMenu` (Log in / Register, or the name and Log out). */
  account?: ReactNode;
  renderLink?: RenderLink;
};

/**
 * Top of every page: the product name as a word mark, the role's short navigation and the account
 * area (R02.6/P12, spec E01 UI/UX "Header shows Log in / Register, or the user's name and Log out").
 * A line, not a shadow, separates it from the page (R01.3).
 */
export function AppHeader({ homeHref = "/", nav = [], currentHref, navLabel, account, renderLink = renderAnchor }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-between-groups gap-y-in-group px-panel py-in-group">
        {renderLink({ href: homeHref, className: cn(navLinkClassName, "-ml-2 type-section-title text-foreground"), children: "DevMentor" })}
        <RoleNav items={nav} currentHref={currentHref} label={navLabel} renderLink={renderLink} />
        {account && <div className="ml-auto flex items-center gap-in-group">{account}</div>}
      </div>
    </header>
  );
}
