import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, userEvent, within } from "storybook/test";

import { DataTable, type DataTableColumn } from "../../src/backend/tables/DataTable";
import { Badge } from "../../src/components/ui/badge";
import { Button } from "../../src/components/ui/button";
import { formatDateTime } from "../../src/lib/format";
import { users, userWithLongValues, type UserRow } from "../mocks/fixtures";

const columns: DataTableColumn<UserRow>[] = [
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role", cell: (user) => <Badge variant="secondary">{user.role}</Badge> },
  { key: "createdAt", header: "Created", cell: (user) => formatDateTime(user.createdAt, "Europe/Warsaw") },
];

const rowActions = (user: UserRow) => (
  <div className="flex justify-end gap-in-group">
    <Button size="sm" variant="outline" aria-label={`Edit ${user.name}`}>
      Edit
    </Button>
    <Button size="sm" variant="ghost" aria-label={`Delete ${user.name}`}>
      Delete
    </Button>
  </div>
);

type Args = { isLoading: boolean; withActions: boolean; onRetry: () => void };

const meta = {
  title: "Primitives/Panel blocks/DataTable",
  args: { isLoading: false, withActions: true, onRetry: fn() },
  argTypes: { onRetry: { table: { disable: true } } },
  render: ({ isLoading, withActions }) => (
    <DataTable columns={columns} rows={users} getRowId={(user) => user.id} isLoading={isLoading} rowActions={withActions ? rowActions : undefined} />
  ),
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Admin user list (`/admin/users`). Tabular admin lists only – product lists use the dense `Item` list (S21). */
export const Playground: Story = {};

/** First load: no rows yet. */
export const Loading: Story = {
  render: () => <DataTable columns={columns} rows={undefined} getRowId={(user) => user.id} isLoading />,
};

/** Nothing yet: the empty state says why and what to do next. */
export const Empty: Story = {
  render: () => (
    <DataTable
      columns={columns}
      rows={[]}
      getRowId={(user) => user.id}
      emptyTitle="No users yet"
      emptyDescription="Users appear here when they register or when you create one."
    />
  ),
};

/** Load failed: technical errors are explained (C18), with *Try again*. */
export const LoadError: Story = {
  render: ({ onRetry }) => (
    <DataTable
      columns={columns}
      rows={undefined}
      getRowId={(user) => user.id}
      error={{ code: "network_error", message: "Could not reach the server. Check your connection." }}
      onRetry={onRetry}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("alert")).toHaveTextContent("No connection");
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await expect(args.onRetry).toHaveBeenCalled();
  },
};

/** Reloading keeps the rows visible (`aria-busy`) instead of flashing a spinner. */
export const Reloading: Story = { args: { isLoading: true } };

/** Many rows: paging with the range and page count (`Pagination`). */
export const ManyRowsWithPaging: Story = {
  render: function Render() {
    const [page, setPage] = useState(1);
    const all = Array.from({ length: 23 }, (_, index) => ({ ...users[index % users.length], id: `p${index}` }));
    return (
      <DataTable
        columns={columns}
        rows={all.slice((page - 1) * 10, page * 10)}
        getRowId={(user) => user.id}
        pagination={{ page, pageSize: 10, total: all.length, onPageChange: setPage }}
        rowActions={rowActions}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("1–10 of 23")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Next" }));
    await expect(canvas.getByText("11–20 of 23")).toBeInTheDocument();
    await expect(canvas.getByText("Page 2 of 3")).toBeInTheDocument();
  },
};

/** Cells do not wrap: long names and emails make the table scroll sideways inside its frame (WCAG 1.4.10 exempts data tables). */
export const LongContentNarrow: Story = {
  globals: { viewport: { value: "mobile320", isRotated: false } },
  render: () => <DataTable columns={columns} rows={[userWithLongValues, users[1]]} getRowId={(user) => user.id} rowActions={rowActions} />,
};
