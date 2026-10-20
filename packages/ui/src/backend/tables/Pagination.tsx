"use client";

import { Button } from "@devmentor/ui/components/ui/button";

export type PaginationProps = {
  /** 1-based page number. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Disables both buttons while the next page loads (no double requests). */
  isLoading?: boolean;
  /** Accessible name of the navigation landmark; name the list when a screen has more than one. */
  label?: string;
};

/**
 * Previous / next paging for long lists (`Page<T>` from the API: page, pageSize, total). Extracted from
 * `DataTable` so product lists reuse it (C9). The range and page count are metadata (`type-meta`, P2).
 */
export function Pagination({ page, pageSize, total, onPageChange, isLoading = false, label = "Pagination" }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-between gap-in-group type-meta tabular-nums text-muted-foreground"
    >
      <span>
        {first}–{last} of {total}
      </span>
      <div className="flex items-center gap-in-group">
        <Button variant="outline" size="sm" disabled={isLoading || page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span>
          Page {page} of {pageCount}
        </span>
        <Button variant="outline" size="sm" disabled={isLoading || page >= pageCount} onClick={() => onPageChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
