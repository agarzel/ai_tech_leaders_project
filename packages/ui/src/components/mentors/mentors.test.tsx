import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { InvitationLinkPanel } from "./InvitationLinkPanel";
import { InvitationStatusBadge } from "./InvitationStatusBadge";

describe("InvitationStatusBadge", () => {
  it.each([
    ["pending", "Pending"],
    ["used", "Used"],
    ["expired", "Expired"],
    ["revoked", "Revoked"],
  ] as const)("names the %s status in words", (status, label) => {
    render(<InvitationStatusBadge status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe("InvitationLinkPanel", () => {
  it("shows the link once with its expiry and focuses it", () => {
    render(
      <InvitationLinkPanel
        email="marek.zielinski@example.com"
        link="https://devmentor.example/register/mentor?token=8f2c1d"
        expiresAt="2026-11-02T17:00:00Z"
        timeZone="Europe/Warsaw"
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByRole("region", { name: "Invitation for marek.zielinski@example.com" })).toBeInTheDocument();
    expect(screen.getByText(/works until Mon 2 Nov, 18:00 \(Europe\/Warsaw, UTC\+1\)/)).toBeInTheDocument();
    expect(screen.getByLabelText("Invitation link")).toHaveFocus();
  });

  it("calls onDone", async () => {
    const onDone = vi.fn();
    render(<InvitationLinkPanel email="a@example.com" link="https://x.example/l" expiresAt="2026-11-02T17:00:00Z" timeZone="UTC" onDone={onDone} />);

    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(onDone).toHaveBeenCalled();
  });
});
