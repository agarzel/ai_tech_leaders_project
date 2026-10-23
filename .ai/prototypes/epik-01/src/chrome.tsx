import type { ReactNode } from "react";

import { AppHeader } from "@devmentor/ui/backend/layout/AppHeader";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { AccountMenu, AccountMenuSkeleton } from "@devmentor/ui/components/auth/AccountMenu";

import { go, renderLink } from "./nav";
import { logout, sessionAccount, useStore, type Role } from "./sim/store";

// Krótka nawigacja ról: tylko miejsca, które istnieją w E01 (L05: bez "My bookings" i "Bookings").
const NAV: Record<Role | "guest", { label: string; href: string }[]> = {
  guest: [{ label: "Mentors", href: "/mentors" }],
  mentee: [{ label: "Mentors", href: "/mentors" }],
  mentor: [
    { label: "Overview", href: "/mentor" },
    { label: "Profile", href: "/mentor/profile" },
    { label: "Slots", href: "/mentor/slots" },
  ],
  admin: [
    { label: "Users", href: "/admin/users" },
    { label: "Invitations", href: "/admin/invitations" },
  ],
};

type PageProps = {
  current: string;
  title: string;
  description?: string;
  width?: "content" | "narrow";
  /** s01.5: sesja się ładuje (AccountMenuSkeleton). */
  sessionLoading?: boolean;
  /** s01.6: sesji nie udało się sprawdzić, strona zachowuje się jak dla gościa. */
  asGuest?: boolean;
  children: ReactNode;
};

/** PageLayout + AppHeader + AccountMenu + RoleNav dla bieżącej roli: wspólna rama każdego ekranu. */
export function Page({ current, title, description, width, sessionLoading, asGuest, children }: PageProps) {
  const session = sessionAccount(useStore());
  const me = asGuest || sessionLoading ? null : session;
  const role = me?.role ?? "guest";
  return (
    <PageLayout
      header={
        <AppHeader
          homeHref="/"
          nav={NAV[role]}
          currentHref={current}
          navLabel="Main"
          renderLink={renderLink}
          account={
            sessionLoading ? (
              <AccountMenuSkeleton />
            ) : (
              <AccountMenu
              user={me ? { id: me.id, name: me.name, role: me.role } : null}
              onLogout={logout}
              onLoggedOut={() => go("/")}
              renderLink={renderLink}
              />
            )
          }
        />
      }
      title={title}
      description={description}
      width={width}
    >
      {children}
    </PageLayout>
  );
}
