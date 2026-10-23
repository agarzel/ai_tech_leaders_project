import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../backend/api/types";
import { MentorProfileForm, type MentorProfileInput } from "./MentorProfileForm";

const TAGS = ["TypeScript", "React", "Python", "AI agents"];
const ok: ApiResult<unknown> = { ok: true, data: null, status: 200 };

const filled: MentorProfileInput = {
  name: "Marek Zieliński",
  headline: "Platform engineer – Kubernetes, Helm, CI",
  bio: "I upgrade clusters for a living.",
  tags: ["Python"],
  links: ["https://github.com/marek"],
  price25: 18000,
  price50: 32000,
  listed: false,
};

const empty: MentorProfileInput = { name: "Marek Zieliński", headline: "", bio: "", tags: [], links: [], price25: null, price50: null, listed: false };

function setup(initialValues = filled, onSubmit = vi.fn(async () => ok), onSaved?: () => void) {
  render(<MentorProfileForm initialValues={initialValues} tagOptions={TAGS} currency="PLN" onSubmit={onSubmit} onSaved={onSaved} />);
  return onSubmit;
}

const save = () => userEvent.click(screen.getByRole("button", { name: "Save profile" }));

describe("MentorProfileForm", () => {
  it("shows the stored values, prices for editing and the currency", () => {
    setup();

    expect(screen.getByLabelText("Name")).toHaveValue("Marek Zieliński");
    expect(screen.getByLabelText("25-minute session")).toHaveValue("180.00");
    expect(screen.getByLabelText("25-minute session")).toHaveAccessibleDescription(/From PLN.10\.00 to PLN.10,000\.00/);
    expect(screen.getByRole("checkbox", { name: "Python" })).toBeChecked();
    expect(screen.getByLabelText("Link 1")).toHaveValue("https://github.com/marek");
    expect(screen.getByRole("checkbox", { name: "Show me on the public list" })).not.toBeChecked();
    expect(screen.getByText(/32 used/)).toBeInTheDocument();
  });

  it("starts an empty profile with one empty link field and empty prices", () => {
    setup(empty);

    expect(screen.getByLabelText("Link 1")).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Remove link 1" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("50-minute session")).toHaveValue("");
  });

  it("saves trimmed values, parsed prices and only filled links, then confirms", async () => {
    const onSaved = vi.fn();
    const onSubmit = setup(empty, vi.fn(async () => ok), onSaved);
    await userEvent.type(screen.getByLabelText("Headline"), "  Platform engineer  ");
    await userEvent.type(screen.getByLabelText("25-minute session"), "180,5");
    await userEvent.click(screen.getByRole("checkbox", { name: "AI agents" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "React" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "React" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Show me on the public list" }));

    await save();

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Marek Zieliński",
      headline: "Platform engineer",
      bio: "",
      tags: ["AI agents"],
      links: [],
      price25: 18050,
      price50: null,
      listed: true,
    });
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved.");
    expect(screen.getByRole("status")).toHaveFocus();
    expect(onSaved).toHaveBeenCalled();
  });

  it("clears the saved message when something changes", async () => {
    setup();
    await save();
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved.");

    await userEvent.type(screen.getByLabelText(/^Bio/), "!");

    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("refuses an incomplete profile and focuses the first problem", async () => {
    const onSubmit = setup({ ...empty, name: "" });

    await save();

    expect(screen.getByText("Enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Add one line about what you can help with.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("checks lengths, links and price ranges", async () => {
    setup({ ...filled, headline: "x".repeat(121), bio: "y".repeat(2001), links: ["http://github.com/marek", "not a url"], price25: 500 });
    await userEvent.type(screen.getByLabelText("50-minute session"), "abc");

    await save();

    expect(screen.getByText("Keep the headline to 120 characters.")).toBeInTheDocument();
    expect(screen.getByText("Keep the bio to 2,000 characters.")).toBeInTheDocument();
    expect(screen.getAllByText("Use a full https:// address, like https://github.com/marek.")).toHaveLength(2);
    expect(screen.getAllByText(/Enter an amount from PLN.10\.00 to PLN.10,000\.00/)).toHaveLength(2);
    expect(screen.getByLabelText("Headline")).toHaveFocus();
  });

  it("checks a changed field on blur, leaves untouched ones quiet and clears the error once fixed", async () => {
    setup();
    await userEvent.click(screen.getByLabelText(/^Bio/));
    await userEvent.tab();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Headline"));
    await userEvent.tab();
    expect(screen.getByText("Add one line about what you can help with.")).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Headline"), "SRE");
    expect(screen.queryByText("Add one line about what you can help with.")).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("25-minute session"));
    await userEvent.type(screen.getByLabelText("25-minute session"), "5");
    await userEvent.tab();
    expect(screen.getByLabelText("25-minute session")).toHaveAttribute("aria-invalid", "true");
  });

  it("checks the name when it is emptied and left", async () => {
    setup();
    await userEvent.clear(screen.getByLabelText("Name"));
    await userEvent.tab();

    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(/Enter your name\./);
  });

  it("adds, focuses, checks and removes links, up to five", async () => {
    setup();
    for (let added = 2; added <= 5; added += 1) {
      await userEvent.click(screen.getByRole("button", { name: "Add link" }));
      expect(screen.getByLabelText(`Link ${added}`)).toHaveFocus();
    }
    expect(screen.queryByRole("button", { name: "Add link" })).not.toBeInTheDocument();
    expect(screen.getByText(/You have added 5 links/)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Link 5"), "github.com/marek");
    await userEvent.tab();
    expect(screen.getByText("Use a full https:// address, like https://github.com/marek.")).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Link 4"));
    await userEvent.tab();

    await userEvent.click(screen.getByRole("button", { name: "Remove link 5" }));
    expect(screen.queryByLabelText("Link 5")).not.toBeInTheDocument();
    expect(screen.queryByText(/https:\/\/ address/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Remove link 1" }));
    expect(screen.getByLabelText("Link 1")).toHaveValue("");
  });

  it("is busy while saving and ignores a second submit", async () => {
    let finish: (result: ApiResult<unknown>) => void = () => undefined;
    const onSubmit = setup(filled, vi.fn(() => new Promise<ApiResult<unknown>>((resolve) => (finish = resolve))));

    await save();
    const busy = screen.getByRole("button", { name: "Saving…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    fireEvent.submit(busy.closest("form") as HTMLFormElement);
    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => finish(ok));
    expect(screen.getByRole("button", { name: "Save profile" })).toBeEnabled();
  });

  it("shows server field errors next to their fields and focuses the first", async () => {
    setup(
      filled,
      vi.fn(async (): Promise<ApiResult<unknown>> => ({
        ok: false,
        status: 400,
        error: {
          code: "validation_error",
          message: "Check the highlighted fields.",
          fieldErrors: {
            price50: ["Enter an amount from PLN 10.00 to PLN 10,000.00."],
            tags: ["Choose tags from the list."],
            links: ["Add at most 5 links."],
            listed: ["Set both prices before joining the public list."],
          },
        },
      })),
    );

    await save();

    expect(screen.getByText("Choose tags from the list.")).toBeInTheDocument();
    expect(screen.getByText("Add at most 5 links.")).toBeInTheDocument();
    expect(screen.getByText("Set both prices before joining the public list.")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "TypeScript" })).toHaveFocus();
    expect(screen.getByLabelText("Headline")).toHaveValue(filled.headline);
  });

  it("focuses the first link when only the link list is rejected", async () => {
    setup(filled, vi.fn(async (): Promise<ApiResult<unknown>> => ({
      ok: false,
      status: 400,
      error: { code: "validation_error", message: "Invalid input", fieldErrors: { links: ["Add at most 5 links."] } },
    })));

    await save();

    expect(screen.getByLabelText("Link 1")).toHaveFocus();
  });

  it("explains a failure without field errors and focuses it", async () => {
    setup(filled, vi.fn(async (): Promise<ApiResult<unknown>> => ({ ok: false, status: 0, error: { code: "network_error", message: "Offline" } })));

    await save();

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("No connection");
    expect(alert.parentElement).toHaveFocus();
  });
});
