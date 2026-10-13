"use client";

import type { ReactNode } from "react";
import { Button } from "@devmentor/ui/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@devmentor/ui/components/ui/table";
import { EmptyState } from "../feedback/EmptyState";
import { ErrorMessage } from "../feedback/ErrorMessage";
import { LoadingMessage } from "../feedback/LoadingMessage";

export type DataTableColumn<T> = {
  key: string;
  header: string;
  /** Custom cell renderer; defaults to `String(row[key])`. */
  cell?: (row: T) => ReactNode;
  className?: string;
};

export type DataTablePagination = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[] | undefined;
  getRowId: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: DataTablePagination;
  rowActions?: (row: T) => ReactNode;
};

/** Column-config-driven list with built-in loading/error/empty states, pagination and row actions. */
export function DataTable<T>({
  columns,
  rows,
  getRowId,
  isLoading = false,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  pagination,
  rowActions,
}: DataTableProps<T>) {
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />;
  if (isLoading && !rows) return <LoadingMessage />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="space-y-3">
      <div className="rounded-lg border" aria-busy={isLoading}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowId(row)}>
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.className}>
                    {column.cell ? column.cell(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </TableCell>
                ))}
                {rowActions && <TableCell className="text-right">{rowActions(row)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {pagination && <Pagination {...pagination} isLoading={isLoading} />}
    </div>
  );
}

function Pagination({ page, pageSize, total, onPageChange, isLoading }: DataTablePagination & { isLoading: boolean }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="text-muted-foreground flex items-center justify-between gap-4 text-sm">
      <span>
        {first}–{last} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={isLoading || page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </Button>
        <span>
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading || page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
