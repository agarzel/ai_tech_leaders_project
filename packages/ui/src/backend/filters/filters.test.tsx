import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ActiveFilters } from "./ActiveFilters";
import { ResultCount } from "./ResultCount";

describe("ActiveFilters", () => {
  const filters = [
    { key: "tag", label: "Stack: React" },
    { key: "status", label: "Status: Confirmed" },
  ];

  it("renders nothing without a filter", () => {
    const { container } = render(<ActiveFilters filters={[]} onRemove={vi.fn()} onClearAll={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("lists each filter as a button that names it and removes it", async () => {
    const onRemove = vi.fn();
    render(<ActiveFilters filters={filters} onRemove={onRemove} onClearAll={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Active filters" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove filter: Status: Confirmed" }));

    expect(onRemove).toHaveBeenCalledWith("status");
  });

  it("drops every filter with Clear filters and takes a custom group name", async () => {
    const onClearAll = vi.fn();
    render(<ActiveFilters filters={filters} onRemove={vi.fn()} onClearAll={onClearAll} label="Mentor filters" />);

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onClearAll).toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Mentor filters" })).toBeInTheDocument();
  });
});

describe("ResultCount", () => {
  it("counts with the singular and the regular plural", () => {
    const { rerender } = render(<ResultCount total={1} noun="mentor" />);
    expect(screen.getByRole("status")).toHaveTextContent("1 mentor");

    rerender(<ResultCount total={12} noun="mentor" />);
    expect(screen.getByRole("status")).toHaveTextContent("12 mentors");
  });

  it("uses a given plural and stays empty while loading", () => {
    const { rerender } = render(<ResultCount total={0} noun="person" plural="people" />);
    expect(screen.getByRole("status")).toHaveTextContent("0 people");

    rerender(<ResultCount total={0} noun="person" plural="people" isLoading />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});
