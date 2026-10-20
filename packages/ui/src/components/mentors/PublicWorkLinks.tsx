import { Skeleton } from "@devmentor/ui/components/ui/skeleton";

/** "https://github.com/marek/" → "github.com/marek": the address people recognise, without the scheme. */
export function displayUrl(url: string): string {
  return url.replace(/^https:\/\//, "").replace(/\/$/, "");
}

/**
 * Links to the mentor's public work – the trust signal instead of ratings (N02, A03; spec E01: up to 5
 * https links). Running-text links (`link-text`, T11) opening in the same tab (C43). None → nothing.
 * `inline` sets them side by side, wrapping, for dense rows such as `MentorCard` (C57).
 */
export function PublicWorkLinks({ links, label = "Public work", inline = false }: { links: string[]; label?: string; inline?: boolean }) {
  if (links.length === 0) return null;
  return (
    <ul aria-label={label} className={inline ? "flex flex-wrap gap-x-between-groups gap-y-in-group" : "flex flex-col gap-in-group"}>
      {links.map((link) => (
        <li key={link} className="min-w-0 type-body">
          <a className="link-text break-all" href={link}>
            {displayUrl(link)}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Placeholder while the profile loads (C3). */
export function PublicWorkLinksSkeleton() {
  return (
    <div className="flex flex-col gap-in-group">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-40" />
    </div>
  );
}
