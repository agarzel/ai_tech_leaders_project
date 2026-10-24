"use client";

import { useSyncExternalStore } from "react";
import { EmptyState } from "@devmentor/ui/backend/feedback/EmptyState";
import { MentorCard } from "@devmentor/ui/components/mentors/MentorCard";
import type { PublicMentor } from "@devmentor/ui/components/mentors/MentorProfileHeader";
import { ItemGroup } from "@devmentor/ui/components/ui/item";
import { browserTimeZone } from "@devmentor/ui/lib/time";
import { renderNextLink } from "../../../components/render-next-link";

const subscribeNever = () => () => undefined;

/** The public list in the viewer's time zone (known only in the browser; the server markup uses UTC). */
export function MentorList({ mentors, filtered }: { mentors: PublicMentor[]; filtered: boolean }) {
  const timeZone = useSyncExternalStore(subscribeNever, browserTimeZone, () => "UTC");

  if (mentors.length === 0) {
    return (
      <EmptyState
        title="No mentors yet"
        description={filtered ? "No listed mentor has this tag. Try another tag." : "Mentors who open their calendar will show up here."}
      />
    );
  }

  return (
    <ItemGroup>
      {mentors.map((mentor) => (
        <MentorCard key={mentor.slug} mentor={mentor} href={`/m/${mentor.slug}`} timeZone={timeZone} renderLink={renderNextLink} />
      ))}
    </ItemGroup>
  );
}
