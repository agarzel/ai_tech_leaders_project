import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyField } from "./CopyField";

const LINK = "https://devmentor.example/register/mentor?token=8f2c1d";

function mockClipboard(writeText: (text: string) => Promise<void>) {
  // user-event installs its own clipboard stub on setup(); override after it.
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CopyField", () => {
  it("shows the value read-only with its label and hint", () => {
    render(<CopyField label="Invitation link" value={LINK} description="Valid for 14 days." />);

    const input = screen.getByLabelText("Invitation link");
    expect(input).toHaveValue(LINK);
    expect(input).toHaveAttribute("readonly");
    expect(input).toHaveAccessibleDescription("Valid for 14 days.");
    expect(input).not.toHaveFocus();
  });

  it("copies the value and confirms it in words", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async () => undefined);
    mockClipboard(writeText);
    render(<CopyField label="Invitation link" value={LINK} />);

    await user.click(screen.getByRole("button", { name: "Copy link" }));

    expect(writeText).toHaveBeenCalledWith(LINK);
    expect(screen.getByRole("status")).toHaveTextContent("Copied to the clipboard.");
  });

  it("selects the text and explains how to copy it when the clipboard refuses", async () => {
    const user = userEvent.setup();
    mockClipboard(async () => {
      throw new DOMException("Denied", "NotAllowedError");
    });
    render(<CopyField label="Share link" value={LINK} copyLabel="Copy share link" />);

    await user.click(screen.getByRole("button", { name: "Copy share link" }));

    const input = screen.getByLabelText<HTMLInputElement>("Share link");
    expect(screen.getByRole("status")).toHaveTextContent("press Ctrl+C");
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(LINK.length);
  });

  it("selects the whole value on focus and can take focus when it appears", async () => {
    render(<CopyField label="Invitation link" value={LINK} autoFocus />);

    const input = screen.getByLabelText<HTMLInputElement>("Invitation link");
    expect(input).toHaveFocus();
    await userEvent.click(input);
    expect(input.selectionEnd).toBe(LINK.length);
  });
});
