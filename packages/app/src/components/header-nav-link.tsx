"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { isCurrentNavHref, navLinkClassName } from "@devmentor/ui/backend/layout/links";

/** A header link that marks the current page (and the pages below it) with `aria-current="page"` (issue 137). */
export function HeaderNavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <Link href={href} className={navLinkClassName} aria-current={isCurrentNavHref(pathname, href) ? "page" : undefined}>
      {children}
    </Link>
  );
}
