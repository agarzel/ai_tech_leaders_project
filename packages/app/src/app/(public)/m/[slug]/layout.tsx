import type { ReactNode } from "react";

// A layout gives this segment its own not-found boundary, so an unknown slug shows `not-found.tsx` here.
export default function MentorShareLayout({ children }: { children: ReactNode }) {
  return children;
}
