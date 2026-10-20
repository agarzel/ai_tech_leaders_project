"use client";

import { useState } from "react";
import { describeApiError } from "@devmentor/ui/backend/api/describeApiError";
import type { ApiResult } from "@devmentor/ui/backend/api/types";
import { navLinkClassName, renderAnchor, type RenderLink } from "@devmentor/ui/backend/layout/links";
import { Button, buttonVariants } from "@devmentor/ui/components/ui/button";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";
import { Spinner } from "@devmentor/ui/components/ui/spinner";
import type { SessionUser } from "./types";

export type { SessionUser };

type AccountMenuProps = {
  /** `null` = signed out. While the session is still loading render `AccountMenuSkeleton` instead. */
  user: SessionUser | null;
  loginHref?: string;
  registerHref?: string;
  /** `apiCall("/api/auth/logout", { method: "POST" })`. */
  onLogout: () => Promise<ApiResult<unknown>>;
  /** Called after the server cleared the session (e.g. go to `/`). */
  onLoggedOut?: () => void;
  renderLink?: RenderLink;
};

/**
 * The account area of the header (spec E01, UI/UX): *Log in* and *Register* for visitors, the person's
 * name and *Log out* when signed in. Inline, not a menu: two actions do not need one (C30).
 */
export function AccountMenu({
  user,
  loginHref = "/login",
  registerHref = "/register",
  onLogout,
  onLoggedOut,
  renderLink = renderAnchor,
}: AccountMenuProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex items-center gap-in-group">
        {renderLink({ href: loginHref, className: navLinkClassName, children: "Log in" })}
        {renderLink({ href: registerHref, className: buttonVariants({ variant: "outline" }), children: "Register" })}
      </div>
    );
  }

  async function logout() {
    setIsLoggingOut(true);
    setError(null);
    const result = await onLogout();
    setIsLoggingOut(false);
    // 401: the session had already expired (24 h, spec E01) – the person is signed out either way.
    if (result.ok || result.error.code === "unauthorized") {
      onLoggedOut?.();
      return;
    }
    setError(describeApiError(result.error).message);
  }

  return (
    <div className="flex flex-col items-end gap-in-group">
      <div className="flex min-w-0 items-center gap-in-group">
        <span className="max-w-48 truncate type-label" title={user.name}>
          {user.name}
        </span>
        <Button variant="ghost" onClick={() => void logout()} disabled={isLoggingOut} aria-busy={isLoggingOut || undefined}>
          {isLoggingOut && <Spinner role="presentation" aria-hidden="true" aria-label={undefined} data-icon="inline-start" />}
          {isLoggingOut ? "Logging out…" : "Log out"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="type-meta text-destructive">
          Could not log out. {error}
        </p>
      )}
    </div>
  );
}

/** Placeholder while the session loads (`GET /api/auth/me`), the size of the signed-out links (C3). */
export function AccountMenuSkeleton() {
  return <Skeleton className="h-control w-40" />;
}
