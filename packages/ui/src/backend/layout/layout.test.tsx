import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppHeader } from "./AppHeader";
import { RoleNav } from "./RoleNav";

const adminNav = [
  { label: "Users", href: "/admin/users" },
  { label: "Invitations", href: "/admin/invitations" },
];

describe("RoleNav", () => {
  it("renders a named landmark with one link per item and marks the current page", () => {
    render(<RoleNav items={adminNav} currentHref="/admin/invitations" label="Admin" />);

    const nav = screen.getByRole("navigation", { name: "Admin" });
    expect(within(nav).getAllByRole("link")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Invitations" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Users" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/admin/users");
  });

  it("renders nothing without items", () => {
    const { container } = render(<RoleNav items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("uses the given link renderer (Next.js Link in the app)", () => {
    render(<RoleNav items={adminNav} renderLink={(props) => <a {...props} data-router="next" />} />);

    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("data-router", "next");
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
  });
});

describe("AppHeader", () => {
  it("shows the word mark, the role navigation and the account area", () => {
    render(
      <AppHeader homeHref="/admin" nav={adminNav} currentHref="/admin/users" navLabel="Admin" account={<button type="button">Log out</button>} />,
    );

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DevMentor" })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("navigation", { name: "Admin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });

  it("works with defaults: home link, no navigation, no account area", () => {
    render(<AppHeader />);

    expect(screen.getByRole("link", { name: "DevMentor" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

describe("PageLayout", () => {
  it("renders the header, one h1 with its description and the content in main", async () => {
    const { PageLayout } = await import("./PageLayout");
    render(
      <PageLayout header={<header>Header</header>} title="Invitations" description="Invite a mentor by email.">
        <p>List</p>
      </PageLayout>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Invitations" })).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByText("Invite a mentor by email.")).toBeInTheDocument();
    expect(within(screen.getByRole("main")).getByText("List")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("max-w-5xl");
  });

  it("has a narrow width for single forms and works without a description", async () => {
    const { PageLayout } = await import("./PageLayout");
    render(
      <PageLayout header={null} title="Log in" width="narrow">
        <p>Form</p>
      </PageLayout>,
    );

    expect(screen.getByRole("main")).toHaveClass("max-w-sm");
    expect(screen.getByRole("main").querySelectorAll("p")).toHaveLength(1);
  });
});
