import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ApiResult } from "../../backend/api/types";
import { AccountMenu, AccountMenuSkeleton } from "./AccountMenu";

const mentee = { id: "u2", name: "Ola Wiśniewska", role: "mentee" as const };
const ok: ApiResult<unknown> = { ok: true, data: null, status: 200 };

describe("AccountMenu", () => {
  it("offers Log in and Register to a visitor", () => {
    render(<AccountMenu user={null} onLogout={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("href", "/register");
  });

  it("uses custom links and renderer", () => {
    render(
      <AccountMenu
        user={null}
        loginHref="/login?next=/book/s1"
        registerHref="/register?next=/book/s1"
        onLogout={vi.fn()}
        renderLink={(props) => <a {...props} data-router="next" />}
      />,
    );

    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login?next=/book/s1");
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute("data-router", "next");
  });

  it("shows the name and logs out, then reports it", async () => {
    const onLogout = vi.fn(async () => ok);
    const onLoggedOut = vi.fn();
    render(<AccountMenu user={mentee} onLogout={onLogout} onLoggedOut={onLoggedOut} />);

    expect(screen.getByText("Ola Wiśniewska")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onLoggedOut).toHaveBeenCalled();
  });

  it("works without onLoggedOut", async () => {
    render(<AccountMenu user={mentee} onLogout={vi.fn(async () => ok)} />);

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("is busy while logging out", async () => {
    let finish: (result: ApiResult<unknown>) => void = () => undefined;
    render(<AccountMenu user={mentee} onLogout={() => new Promise((resolve) => (finish = resolve))} />);

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    const busy = screen.getByRole("button", { name: "Logging out…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    await act(async () => finish(ok));
  });

  it("explains a failed logout", async () => {
    const onLoggedOut = vi.fn();
    render(
      <AccountMenu
        user={mentee}
        onLogout={async () => ({ ok: false, status: 0, error: { code: "network_error", message: "Could not reach the server." } })}
        onLoggedOut={onLoggedOut}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Could not log out. We could not reach DevMentor.");
    expect(onLoggedOut).not.toHaveBeenCalled();
  });

  it("treats an already expired session as logged out", async () => {
    const onLoggedOut = vi.fn();
    render(
      <AccountMenu
        user={mentee}
        onLogout={async () => ({ ok: false, status: 401, error: { code: "unauthorized", message: "Authentication required" } })}
        onLoggedOut={onLoggedOut}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Log out" }));

    expect(onLoggedOut).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has a skeleton for the loading session", () => {
    const { container } = render(<AccountMenuSkeleton />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});
