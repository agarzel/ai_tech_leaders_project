import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuditLogTable } from "./AuditLogTable";
import { AUDIT_ACTION_LABELS, describeAction, describeDetails, describeUser, isAuditAction, type AuditEventView } from "./describe-audit-event";

const ada = { id: "u1", name: "Ada", email: "ada@example.com" };
const admin = { id: "a1", name: "Admin", email: "admin@example.com" };

function event(overrides: Partial<AuditEventView> = {}): AuditEventView {
  return {
    id: "e1",
    occurredAt: "2026-11-11T09:30:00.000Z",
    action: "user.role_changed",
    actorKind: "admin",
    actor: admin,
    target: ada,
    details: { from: "mentee", to: "mentor" },
    ...overrides,
  };
}

describe("describeAction", () => {
  it.each(Object.entries(AUDIT_ACTION_LABELS))("describes %s in plain words", (action, label) => {
    expect(describeAction(action)).toBe(label);
    expect(isAuditAction(action)).toBe(true);
  });

  it("never shows a raw key it does not know", () => {
    expect(describeAction("user.renamed")).toBe("Unknown action");
    expect(isAuditAction("toString")).toBe(false);
  });
});

describe("describeDetails", () => {
  it.each([
    ["user.role_changed", { from: "mentee", to: "mentor" }, "mentee → mentor"],
    ["user.role_changed", { from: "boss", to: 3 }, "unknown role → unknown role"],
    ["user.created", { role: "admin" }, "As admin"],
    ["user.deleted", { role: "admin" }, "Was admin"],
    ["invitation.revoked", { invitationId: "i1" }, "Replaced by a new invitation"],
    ["auth.admin_password_set", { created: true, promoted: true }, "New admin account"],
    ["auth.admin_password_set", { created: false, promoted: true }, "Promoted to admin"],
    ["auth.admin_password_set", { created: false, promoted: false }, "Already an admin"],
    ["invitation.created", { invitationId: "i1" }, "—"],
    ["auth.login_failed", {}, "—"],
  ])("describes %s %j as %s", (action, details, text) => {
    expect(describeDetails({ action, details })).toBe(text);
  });
});

describe("describeUser", () => {
  it.each([
    [ada, undefined, "Ada · ada@example.com"],
    [{ id: "gone", deleted: true as const }, undefined, "Deleted user"],
    [null, "cli", "CLI"],
    [null, "anonymous", "Anonymous"],
    [null, "admin", "—"],
    [null, undefined, "—"],
  ])("shows %j (%s) as %s", (user, kind, text) => {
    expect(describeUser(user, kind)).toBe(text);
  });
});

describe("AuditLogTable", () => {
  it("renders every column in plain words, with no raw key, id or ISO date", () => {
    render(<AuditLogTable timeZone="Europe/Warsaw" events={[event(), event({ id: "e2", action: "auth.login_failed", actorKind: "anonymous", actor: null, target: null, details: {} })]} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]!).getByText("Role changed")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Admin · admin@example.com")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Ada · ada@example.com")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("mentee → mentor")).toBeInTheDocument();
    expect(within(rows[0]!).getByText("Wed 11 Nov, 10:30")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Failed login")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Anonymous")).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    for (const raw of ["user.role_changed", "auth.login_failed", "2026-11-11T", "u1", "null", "undefined"]) expect(text).not.toContain(raw);
  });

  it("lets a keyboard user reach and scroll the read-only table", () => {
    render(<AuditLogTable timeZone="Europe/Warsaw" events={[event()]} />);

    expect(screen.getByRole("region", { name: "Audit log" })).toHaveAttribute("tabindex", "0");
  });

  it("shows the empty state", () => {
    render(<AuditLogTable timeZone="Europe/Warsaw" events={[]} />);

    expect(screen.getByText("No audit entries yet")).toBeInTheDocument();
  });
});
