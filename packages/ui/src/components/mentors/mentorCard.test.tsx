import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MentorCard, MentorCardSkeleton } from "./MentorCard";
import { PublicWorkLinks } from "./PublicWorkLinks";
import type { PublicMentor } from "./types";

const mentor: PublicMentor = {
  slug: "marek-k3x9q2",
  name: "Marek Zieliński",
  headline: "Platform engineer – Kubernetes, Helm, CI pipelines",
  bio: null,
  tags: ["Python", "AI agents"],
  links: ["https://github.com/marek-zielinski", "https://kubecon.example/talks/helm"],
  price25: 18000,
  price50: 32000,
  currency: "PLN",
  soonestSlotAt: "2026-11-04T17:00:00Z",
};

describe("MentorCard", () => {
  it("is one list row: the name links to the share page, with headline, tags, work, prices and the next time", () => {
    render(<MentorCard mentor={mentor} href="/m/marek-k3x9q2" timeZone="Europe/Warsaw" />);

    const link = screen.getByRole("link", { name: "Marek Zieliński" });
    expect(link).toHaveAttribute("href", "/m/marek-k3x9q2");
    expect(link).toHaveAttribute("data-slot", "item-link");
    expect(screen.getByText("Platform engineer – Kubernetes, Helm, CI pipelines")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Stack of Marek Zieliński" })).toHaveTextContent("PythonAI agents");
    expect(within(screen.getByRole("list", { name: "Public work of Marek Zieliński" })).getAllByRole("link")).toHaveLength(2);
    expect(screen.getByText("PLN 180.00")).toBeInTheDocument();
    expect(screen.getByText("PLN 320.00")).toBeInTheDocument();
    expect(screen.getByText("Next time: Wed 4 Nov, 18:00 (Europe/Warsaw, UTC+1)")).toBeInTheDocument();
  });

  it("leaves out what the mentor has not filled in", () => {
    render(<MentorCard mentor={{ ...mentor, headline: null, tags: [], links: [], soonestSlotAt: null }} href="/m/x" timeZone="Europe/Warsaw" />);

    expect(screen.queryByText(/Platform engineer/)).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Stack of/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Public work of/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/Next time/)).not.toBeInTheDocument();
  });

  it("renders the link through renderLink", () => {
    render(
      <MentorCard
        mentor={mentor}
        href="/m/x"
        timeZone="UTC"
        renderLink={({ children, ...props }) => (
          <a {...props} data-custom="yes">
            {children}
          </a>
        )}
      />,
    );

    expect(screen.getByRole("link", { name: "Marek Zieliński" })).toHaveAttribute("data-custom", "yes");
  });

  it("has a loading skeleton", () => {
    render(<MentorCardSkeleton />);

    expect(screen.getByRole("status", { name: "Loading mentors" })).toBeInTheDocument();
  });
});

describe("PublicWorkLinks inline", () => {
  it("sets the links side by side, wrapping", () => {
    render(<PublicWorkLinks links={mentor.links} inline />);

    expect(screen.getByRole("list", { name: "Public work" })).toHaveClass("flex-wrap");
  });
});
