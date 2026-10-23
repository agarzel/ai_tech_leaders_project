import type { ReactNode } from "react";

import { AppHeader } from "@devmentor/ui/backend/layout/AppHeader";
import { PageLayout } from "@devmentor/ui/backend/layout/PageLayout";
import { AccountMenu } from "@devmentor/ui/components/auth/AccountMenu";

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

type PageProps = { current: string; title: string; description?: string; width?: "content" | "narrow"; children: ReactNode };

/** PageLayout + AppHeader + AccountMenu + RoleNav dla bieżącej roli: wspólna rama każdego ekranu. */
export function Page({ current, title, description, width, children }: PageProps) {
  const me = sessionAccount(useStore());
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
            <AccountMenu
              user={me ? { id: me.id, name: me.name, role: me.role } : null}
              onLogout={logout}
              onLoggedOut={() => go("/")}
              renderLink={renderLink}
            />
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
