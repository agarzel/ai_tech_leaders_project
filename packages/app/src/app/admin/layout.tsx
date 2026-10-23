import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { getSessionUser } from "../../lib/session";

// Admin pages are gated here as well as in the API: a visitor never sees the panel's shell.
async function AdminGate({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/");
  return children;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingMessage />}>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
