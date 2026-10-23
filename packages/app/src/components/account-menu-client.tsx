"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiCall } from "@devmentor/ui/backend/api/apiCall";
import type { RenderLink } from "@devmentor/ui/backend/layout/links";
import { AccountMenu, type SessionUser } from "@devmentor/ui/components/auth/AccountMenu";

const renderNextLink: RenderLink = ({ href, ...props }) => <Link href={href} {...props} />;

/** Client side of the header account area: wires `AccountMenu` to the logout route and the router. */
export function AccountMenuClient({ user }: { user: SessionUser | null }) {
  const router = useRouter();

  return (
    <AccountMenu
      user={user}
      renderLink={renderNextLink}
      onLogout={() => apiCall("/api/auth/logout", { method: "POST" })}
      onLoggedOut={() => {
        router.push("/");
        // Re-render the server components so the header reads the cleared cookie.
        router.refresh();
      }}
    />
  );
}
