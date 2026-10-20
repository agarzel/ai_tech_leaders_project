import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MentorProfileHeader, MentorProfileHeaderSkeleton } from "./MentorProfileHeader";
import { OfferChecklist, OfferChecklistSkeleton } from "./OfferChecklist";
import { PriceList, PriceListSkeleton } from "./PriceList";
import { displayUrl, PublicWorkLinks, PublicWorkLinksSkeleton } from "./PublicWorkLinks";
import { TagList, TagListSkeleton } from "./TagList";

describe("TagList", () => {
  it("lists tags under a name", () => {
    render(<TagList tags={["TypeScript", "AI agents"]} />);

    expect(within(screen.getByRole("list", { name: "Stack" })).getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders nothing without tags, and has a skeleton", () => {
    const { container } = render(<TagList tags={[]} label="Tags" />);
    expect(container).toBeEmptyDOMElement();
    render(<TagListSkeleton />);
  });
});

describe("PublicWorkLinks", () => {
  it("shows each link without the scheme and trailing slash", () => {
    render(<PublicWorkLinks links={["https://github.com/marek/", "https://kubecon.example/talks/helm-rollbacks"]} />);

    const link = screen.getByRole("link", { name: "github.com/marek" });
    expect(link).toHaveAttribute("href", "https://github.com/marek/");
    expect(link).not.toHaveAttribute("target");
    expect(screen.getByRole("list", { name: "Public work" })).toBeInTheDocument();
  });

  it("renders nothing without links, and has a skeleton", () => {
    const { container } = render(<PublicWorkLinks links={[]} />);
    expect(container).toBeEmptyDOMElement();
    render(<PublicWorkLinksSkeleton />);
    expect(displayUrl("https://x.example")).toBe("x.example");
  });
});

describe("PriceList", () => {
  it("shows both prices in the currency", () => {
    render(<PriceList price25={18000} price50={32000} currency="PLN" />);

    expect(screen.getByText(/^PLN.180\.00$/)).toBeInTheDocument();
    expect(screen.getByText(/^PLN.320\.00$/)).toBeInTheDocument();
    expect(screen.getByText("25 min")).toBeInTheDocument();
  });

  it("says a missing price is not set, and has a skeleton", () => {
    render(<PriceList price25={null} price50={32000} currency="PLN" />);
    expect(screen.getByText("Not set")).toBeInTheDocument();
    render(<PriceListSkeleton />);
  });
});

describe("MentorProfileHeader", () => {
  it("shows headline, tags, links and bio", () => {
    render(
      <MentorProfileHeader
        mentor={{ headline: "Platform engineer", bio: "Line one\nLine two", tags: ["Python"], links: ["https://github.com/marek"] }}
      />,
    );

    const section = screen.getByRole("region", { name: "About the mentor" });
    expect(within(section).getByText("Platform engineer")).toBeInTheDocument();
    expect(within(section).getByText(/Line one/)).toBeInTheDocument();
    expect(within(section).getByRole("link", { name: "github.com/marek" })).toBeInTheDocument();
  });

  it("leaves out what the mentor has not filled in, and has a skeleton", () => {
    render(<MentorProfileHeader mentor={{ headline: null, bio: null, tags: [], links: [] }} />);
    expect(screen.getByRole("region", { name: "About the mentor" })).toBeEmptyDOMElement();
    const { container } = render(<MentorProfileHeaderSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

const hrefs = { profile: "/mentor/profile", slots: "/mentor/slots" };
const base = { shareUrl: "https://devmentor.example/m/marek-k3x9q2", hrefs };

function step(name: string) {
  return screen.getByText(name, { selector: "[data-slot=item-title]" }).closest("[data-slot=item]") as HTMLElement;
}

describe("OfferChecklist", () => {
  it("guides a new mentor: everything to do, the first step's action is the accent", () => {
    render(<OfferChecklist {...base} profileComplete={false} pricesSet={false} bookableSlots={0} slotsTooSoon={0} listed={false} />);

    expect(step("Profile")).toHaveTextContent("To do");
    expect(within(step("Profile")).getByRole("link", { name: "Complete profile: Profile" })).toHaveClass("bg-primary");
    expect(within(step("Prices")).getByRole("link", { name: "Set prices: Prices" })).toHaveAttribute("href", "/mentor/profile");
    expect(step("A time mentees can book")).toHaveTextContent("Add at least one time");
    expect(step("Share link")).toHaveTextContent("No times available");
    expect(step("Public list")).toHaveTextContent("Optional");
    expect(screen.getByLabelText("Your share link")).toHaveValue(base.shareUrl);
  });

  it("explains slots that start too soon and marks the opt-in as waiting", () => {
    render(<OfferChecklist {...base} profileComplete pricesSet bookableSlots={0} slotsTooSoon={2} listed />);

    expect(step("Profile")).toHaveTextContent("Done");
    expect(within(step("Prices")).getByRole("link", { name: "Change prices: Prices" })).toBeInTheDocument();
    expect(step("A time mentees can book")).toHaveTextContent("start within 24 hours");
    expect(within(step("A time mentees can book")).getByRole("link", { name: "Add a time: A time mentees can book" })).toHaveClass("bg-primary");
    expect(step("Public list")).toHaveTextContent("You opted in");
  });

  it("shows a bookable, listed mentor as done", () => {
    render(
      <OfferChecklist {...base} profileComplete pricesSet bookableSlots={1} slotsTooSoon={0} listed renderLink={(props) => <a {...props} data-router="next" />} />,
    );

    expect(step("A time mentees can book")).toHaveTextContent("1 time is open for booking.");
    expect(step("Share link")).toHaveTextContent("Anyone with this link");
    expect(step("Public list")).toHaveTextContent("You are on the public list");
    expect(screen.getByRole("link", { name: "Edit profile: Profile" })).toHaveAttribute("data-router", "next");
    expect(screen.queryByText("To do")).not.toBeInTheDocument();
  });

  it("counts several times and offers the list to a bookable mentor who has not opted in", () => {
    render(<OfferChecklist {...base} profileComplete pricesSet bookableSlots={3} slotsTooSoon={0} listed={false} />);

    expect(step("A time mentees can book")).toHaveTextContent("3 times are open for booking.");
    expect(screen.getByRole("link", { name: "Show me on the list: Public list" })).not.toHaveClass("bg-primary");
    render(<OfferChecklistSkeleton />);
  });
});
