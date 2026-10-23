import Link from "next/link";
import { Suspense } from "react";
import { AppHeader } from "@devmentor/ui/backend/layout/AppHeader";
import { navLinkClassName } from "@devmentor/ui/backend/layout/links";
import { AccountMenuSkeleton } from "@devmentor/ui/components/auth/AccountMenu";
import { getSessionUser } from "../lib/session";
import { AccountMenuClient } from "./account-menu-client";

async function HeaderAccount() {
  const user = await getSessionUser();

  return (
    <>
      {user?.role === "admin" && (
        <Link href="/admin" className={navLinkClassName}>
          Admin
        </Link>
      )}
      {/* Only what the header shows crosses to the client: no email. */}
      <AccountMenuClient user={user && { id: user.id, name: user.name, role: user.role }} />
    </>
  );
}

/** The header of every page: Log in / Register for visitors, the name and Log out when signed in. */
export function SiteHeader() {
  return (
    <AppHeader
      account={
        <Suspense fallback={<AccountMenuSkeleton />}>
          <HeaderAccount />
        </Suspense>
      }
    />
  );
}
