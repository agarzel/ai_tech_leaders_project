import { useEffect, useSyncExternalStore, type ReactNode } from "react";

import type { RenderLink } from "@devmentor/ui/backend/layout/links";

import { getState, sessionAccount, setReturnTo, setRoute, useStore, type Role } from "./sim/store";

/** Ekrany z mapy: ID, trasa produktu, nazwa. ID są trwałe (komentarze są do nich przypięte). */
export const SCREENS = [
  { id: "s01", path: "/", title: "Start page" },
  { id: "s02", path: "/register", title: "Register (mentee)" },
  { id: "s03", path: "/login", title: "Log in" },
  { id: "s04", path: "/register/mentor", title: "Mentor registration" },
  { id: "s05", path: "/admin", title: "Admin home" },
  { id: "s06", path: "/admin/invitations", title: "Invitations" },
  { id: "s07", path: "/mentor", title: "Mentor overview" },
  { id: "s08", path: "/mentor/profile", title: "Profile and prices" },
  { id: "s09", path: "/mentor/slots", title: "Slots" },
  { id: "s10", path: "/mentors", title: "Mentor list" },
  { id: "s11", path: "/m/[slug]", title: "Mentor page" },
  { id: "s12", path: "*", title: "Not found" },
] as const;
export type ScreenId = (typeof SCREENS)[number]["id"];

export const ROLE_LANDING: Record<Role, string> = { mentee: "/mentors", mentor: "/mentor", admin: "/admin" };

/** Które role mogą wejść na trasę (L02: pozostałe są przekierowane na /login). */
export function roleFor(path: string): Role | null {
  if (path === "/admin" || path.startsWith("/admin/")) return "admin";
  if (path === "/mentor" || path.startsWith("/mentor/")) return "mentor";
  return null;
}

function resolve(path: string): { screen: ScreenId; slug?: string; token?: string } {
  const url = new URL(path, "http://prototype.local");
  const p = url.pathname.replace(/\/$/, "") || "/";
  const slug = p.match(/^\/m\/([^/]+)$/)?.[1];
  if (slug) return { screen: "s11", slug };
  if (p === "/register/mentor") return { screen: "s04", token: url.searchParams.get("token") ?? undefined };
  const match = SCREENS.find((screen) => screen.path === p && screen.id !== "s11" && screen.id !== "s12");
  return { screen: match?.id ?? "s12" };
}

/** Przejście produktu: ustawia parametry trasy i prosi silnik przeglądu o przejście do ekranu. */
export function go(path: string) {
  const { screen, slug, token } = resolve(path);
  setRoute({ slug, token, path });
  document.dispatchEvent(new CustomEvent("prototype:navigate", { detail: screen }));
}

/** Po zalogowaniu: powrót na stronę, z której przyszedł (L02), jeśli rola jej nie zabrania, inaczej ekran startowy roli (L04). */
export function afterLogin() {
  const state = getState();
  const me = sessionAccount(state);
  if (!me) return;
  const back = state.returnTo;
  const needed = back ? roleFor(back) : null;
  setReturnTo(null, null);
  go(back && (needed === null || needed === me.role) ? back : ROLE_LANDING[me.role]);
}

let current: string = (typeof location !== "undefined" && location.hash.slice(1)) || "s01";
const listeners = new Set<() => void>();
document.addEventListener("prototype:screen-change", (event) => {
  current = (event as CustomEvent<string>).detail;
  // Przejście paskiem przeglądu (hash) omija go(): ścieżka produktu ma wtedy wskazywać ten ekran, żeby powrót po logowaniu był poprawny.
  const route = getState().route;
  if (resolve(route.path ?? "/").screen !== current) {
    const screen = SCREENS.find((entry) => entry.id === current);
    setRoute({ ...route, path: screen && screen.id !== "s11" && screen.id !== "s12" ? screen.path : "/" });
  }
  listeners.forEach((listener) => listener());
});
export function useCurrentScreen(): string {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
}

/** Linki produktu: każdy działa (idzie do ekranu prototypu); /admin/users jest poza zakresem (P4), więc nieaktywny z dopiskiem. */
export const renderLink: RenderLink = ({ href, children, onClick, ...rest }) => {
  if (href === "/admin/users") {
    return (
      <a {...rest} href={href} aria-disabled="true" title="Not in this prototype" onClick={(event) => event.preventDefault()}>
        {children}
        <span className="ml-1 type-meta"> (not in this prototype)</span>
      </a>
    );
  }
  return (
    <a
      {...rest}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
        event.preventDefault();
        go(href);
      }}
    >
      {children}
    </a>
  );
};

export function Link({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  return renderLink({ href, className, children });
}

/** Bramka dostępu (L02): gość lub zła rola → /login z komunikatem, po zalogowaniu powrót (A01). */
export function Guard({ role, path, children }: { role: Role; path: string; children: ReactNode }) {
  const me = sessionAccount(useStore());
  const allowed = me?.role === role;
  useEffect(() => {
    if (allowed) return;
    setReturnTo(path, me ? `This page is for ${role} accounts. Log in with a different account.` : "Log in to continue.");
    go("/login");
  }, [allowed, me, path, role]);
  return allowed ? <>{children}</> : null;
}
