import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { LoadingMessage } from "@devmentor/ui/backend/feedback/LoadingMessage";
import { homePathFor } from "../../lib/home-path";
import { getSessionUser } from "../../lib/session";

// Mentor pages are gated here as well as in the API. Anyone else goes where their role belongs (admin panel, home).
async function MentorGate({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "mentor") redirect(homePathFor(user.role));
  return children;
}

export default function MentorLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingMessage />}>
      <MentorGate>{children}</MentorGate>
    </Suspense>
  );
}
