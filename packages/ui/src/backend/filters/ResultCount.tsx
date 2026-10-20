type ResultCountProps = {
  /** Matching items across all pages (`Page.total`). */
  total: number;
  /** "mentor" → "1 mentor", "2 mentors"; pass `plural` for irregular nouns. */
  noun: string;
  plural?: string;
  /** Replaces the count while the list reloads, so a stale number is never announced. */
  isLoading?: boolean;
};

/**
 * "12 mentors" above a list, in a polite status region so a screen reader hears the new count after a
 * filter changes (C9, C59). Metadata, not a counter badge (P10). While loading it stays empty.
 */
export function ResultCount({ total, noun, plural = `${noun}s`, isLoading = false }: ResultCountProps) {
  return (
    <p role="status" className="type-meta tabular-nums text-muted-foreground">
      {isLoading ? "" : `${total} ${total === 1 ? noun : plural}`}
    </p>
  );
}
