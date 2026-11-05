import { Suspense } from "react";
import { AppHeader } from "@devmentor/ui/backend/layout/AppHeader";
import { AccountMenuSkeleton } from "@devmentor/ui/components/auth/AccountMenu";
import { getSessionUser } from "../lib/session";
import { AccountMenuClient } from "./account-menu-client";
import { HeaderNavLink } from "./header-nav-link";

async function HeaderAccount() {
  const user = await getSessionUser();

  return (
    <>
      {/* A mentor receives bookings and may also book another mentor (#98), so they get both lists. */}
      {user?.role === "mentor" && (
        <HeaderNavLink href="/mentor/bookings">
          Bookings
        </HeaderNavLink>
      )}
      {user && user.role !== "admin" && (
        <HeaderNavLink href="/bookings">
          My bookings
        </HeaderNavLink>
      )}
      {user?.role === "admin" && (
        <HeaderNavLink href="/admin">
          Admin
        </HeaderNavLink>
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
