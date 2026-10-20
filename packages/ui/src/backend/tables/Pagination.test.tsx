import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("names its landmark after the list it pages", () => {
    render(<Pagination page={2} pageSize={10} total={34} onPageChange={vi.fn()} label="Bookings pages" />);

    const nav = screen.getByRole("navigation", { name: "Bookings pages" });
    expect(nav).toHaveTextContent("11–20 of 34");
    expect(nav).toHaveTextContent("Page 2 of 4");
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });
});
