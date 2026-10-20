import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingMessage } from "./LoadingMessage";

describe("LoadingMessage", () => {
  it("renders a single status region with the default label", () => {
    render(<LoadingMessage />);

    // Exactly one live region – the spinner inside must not be a second "status".
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("renders a custom label", () => {
    render(<LoadingMessage label="Fetching users" />);

    expect(screen.getByRole("status")).toHaveTextContent("Fetching users");
  });
});

describe("ErrorMessage", () => {
  it("renders the default title and the message without a retry button", () => {
    render(<ErrorMessage message="Network down" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByRole("alert")).toHaveTextContent("Network down");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("explains a technical API error instead of showing its raw message", () => {
    render(<ErrorMessage error={{ code: "invalid_response", message: "Unexpected response from the server (502)." }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong on our side");
    expect(screen.getByRole("alert")).toHaveTextContent("Try again in a moment.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("502");
  });

  it("shows a domain API error's message under the given title", () => {
    render(<ErrorMessage title="Could not book" error={{ code: "conflict", message: "This time was just taken" }} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not book");
    expect(screen.getByRole("alert")).toHaveTextContent("This time was just taken");
  });

  it("renders a custom title and calls onRetry", async () => {
    const onRetry = vi.fn();
    render(<ErrorMessage title="Could not save" message="Try later" onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyState", () => {
  it("renders only the title by default", () => {
    const { container } = render(<EmptyState title="No users yet" />);

    expect(screen.getByText("No users yet")).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("renders a description and an action", () => {
    render(<EmptyState title="No users" description="Create one" action={<button>New</button>} />);

    expect(screen.getByText("Create one")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New" })).toBeInTheDocument();
  });
});
