import { Skeleton } from "@devmentor/ui/components/ui/skeleton";
import { PublicWorkLinks } from "./PublicWorkLinks";
import { TagList } from "./TagList";
import type { PublicMentor } from "./types";

export type { PublicMentor } from "./types";

/**
 * Who the mentor is, on their share page `/m/[slug]` (spec E01, Phase 4): headline, stack tags, public
 * work and the bio. The name is the page title (`PageLayout`); prices and times follow below (R01.5:
 * price visible before anything is typed). No avatar wall, no years of experience, no ratings (A03, A05).
 */
export function MentorProfileHeader({ mentor }: { mentor: Pick<PublicMentor, "headline" | "bio" | "tags" | "links"> }) {
  return (
    <section aria-label="About the mentor" className="flex flex-col gap-between-groups">
      {mentor.headline && <p className="max-w-prose type-section-title">{mentor.headline}</p>}
      <TagList tags={mentor.tags} />
      <PublicWorkLinks links={mentor.links} />
      {mentor.bio && <p className="max-w-prose whitespace-pre-line break-words type-body">{mentor.bio}</p>}
    </section>
  );
}

/** Placeholder while the profile loads (C3). */
export function MentorProfileHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-between-groups" aria-hidden="true">
      <Skeleton className="h-6 w-80 max-w-full" />
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-16 w-full max-w-prose" />
    </div>
  );
}
