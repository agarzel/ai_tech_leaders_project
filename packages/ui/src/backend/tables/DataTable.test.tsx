import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableColumn } from "./DataTable";

type Row = { id: string; name: string; note: string | null };

const rows: Row[] = [
  { id: "1", name: "Ada", note: "first" },
  { id: "2", name: "Grace", note: null },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", className: "w-1/2" },
  { key: "note", header: "Note" },
  { key: "shout", header: "Shout", cell: (row) => row.name.toUpperCase() },
];

describe("DataTable", () => {
  it("shows the error state with retry instead of the table", async () => {
    const onRetry = vi.fn();
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} error="Boom" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Boom");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("shows the loading state while the first page is loading", () => {
    render(<DataTable columns={columns} rows={undefined} getRowId={(r) => r.id} isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("shows the default empty state when there are no rows", () => {
    render(<DataTable columns={columns} rows={undefined} getRowId={(r) => r.id} />);

    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("shows a custom empty state for an empty list", () => {
    render(
      <DataTable columns={columns} rows={[]} getRowId={(r) => r.id} emptyTitle="No users" emptyDescription="Add one" />,
    );

    expect(screen.getByText("No users")).toBeInTheDocument();
    expect(screen.getByText("Add one")).toBeInTheDocument();
  });

  it("renders headers and cells with default and custom renderers", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} />);

    expect(screen.getAllByRole("columnheader").map((th) => th.textContent)).toEqual(["Name", "Note", "Shout"]);
    const [, ada, grace] = screen.getAllByRole("row");
    expect(within(ada).getAllByRole("cell").map((td) => td.textContent)).toEqual(["Ada", "first", "ADA"]);
    // null renders as an empty cell, not "null".
    expect(within(grace).getAllByRole("cell").map((td) => td.textContent)).toEqual(["Grace", "", "GRACE"]);
    expect(screen.getByRole("columnheader", { name: "Name" })).toHaveClass("w-1/2");
    expect(screen.queryByRole("columnheader", { name: "Actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("table").parentElement?.parentElement).toHaveAttribute("aria-busy", "false");
  });

  it("keeps showing rows while reloading", () => {
    render(<DataTable columns={columns} rows={rows} getRowId={(r) => r.id} isLoading />);

    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("renders row actions in an Actions column", () => {
    render(
      <DataTable columns={columns} rows={rows} getRowId={(r) => r.id} rowActions={(row) => <button>Edit {row.name}</button>} />,
    );

    expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Grace" })).toBeInTheDocument();
  });

  describe("pagination", () => {
    function renderPage(page: number, total: number, isLoading = false) {
      const onPageChange = vi.fn();
      render(
        <DataTable
          columns={columns}
          rows={rows}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          pagination={{ page, pageSize: 2, total, onPageChange }}
        />,
      );
      return onPageChange;
    }

    it("shows the range and moves forward from the first page", async () => {
      const onPageChange = renderPage(1, 5);

      expect(screen.getByText("1–2 of 5")).toBeInTheDocument();
      expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
      await userEvent.click(screen.getByRole("button", { name: "Next" }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("moves back from the last page and clamps the range", async () => {
      const onPageChange = renderPage(3, 5);

      expect(screen.getByText("5–5 of 5")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
      await userEvent.click(screen.getByRole("button", { name: "Previous" }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("disables both buttons while loading", () => {
      renderPage(2, 5, true);

      expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    });

    it("shows one page when there are no results", () => {
      renderPage(1, 0);

      expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
    });
  });
});
