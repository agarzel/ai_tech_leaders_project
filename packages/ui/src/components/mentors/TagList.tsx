import { Badge } from "@devmentor/ui/components/ui/badge";
import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

/**
 * The mentor's stack tags (spec E01: a subset of MENTOR_TAGS) as neutral badges – never the accent (T10),
 * no counts or levels (A05). No tags → nothing is rendered (partial profile).
 */
export function TagList({ tags, label = "Stack" }: { tags: string[]; label?: string }) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label={label} className="flex flex-wrap gap-in-group">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge variant="secondary">{tag}</Badge>
        </li>
      ))}
    </ul>
  );
}

/** Placeholder while the profile loads (C3). */
export function TagListSkeleton() {
  return (
    <div className="flex gap-in-group">
      <Skeleton className="h-5 w-20" />
      <Skeleton className="h-5 w-16" />
    </div>
  );
}
