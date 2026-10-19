"use client";

import type { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@devmentor/ui/components/ui/table";
import type { ApiError } from "../api/types";
import { EmptyState } from "../feedback/EmptyState";
import { ErrorMessage } from "../feedback/ErrorMessage";
import { LoadingMessage } from "../feedback/LoadingMessage";
import { Pagination } from "./Pagination";

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
  /** A message written for people, or the API error (technical codes are explained – C18). */
  error?: string | ApiError | null;
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
  if (error) {
    return typeof error === "string" ? (
      <ErrorMessage message={error} onRetry={onRetry} />
    ) : (
      <ErrorMessage title="Could not load the list" error={error} onRetry={onRetry} />
    );
  }
  if (isLoading && !rows) return <LoadingMessage />;
  if (!rows || rows.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="flex flex-col gap-in-group">
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
