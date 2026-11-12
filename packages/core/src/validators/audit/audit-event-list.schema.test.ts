import { describe, expect, it } from "vitest";
import { AUDIT_ACTIONS, AUDIT_PAGE_SIZE_MAX, auditEventListQuerySchema } from "./audit-event-list.schema";

describe("AUDIT_ACTIONS re-export", () => {
  it("offers every action to client code and accepts each one as a filter", () => {
    expect(AUDIT_ACTIONS).toContain("user.created");
    for (const action of AUDIT_ACTIONS) expect(auditEventListQuerySchema.parse({ action }).action).toBe(action);
  });
});

const ACTOR = "6f1c2a7e-8b3d-4c5e-9f10-2a3b4c5d6e7f";

describe("auditEventListQuerySchema", () => {
  it("defaults to the first page of 20", () => {
    expect(auditEventListQuerySchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces query-string numbers and accepts a known action and an actor id", () => {
    expect(auditEventListQuerySchema.parse({ page: "3", pageSize: "100", action: "user.deleted", actorUserId: ACTOR })).toEqual({
      page: 3,
      pageSize: 100,
      action: "user.deleted",
      actorUserId: ACTOR,
    });
  });

  it.each([
    ["a page size above the maximum", { pageSize: String(AUDIT_PAGE_SIZE_MAX + 1) }],
    ["page 0", { page: "0" }],
    ["a fractional page", { page: "1.5" }],
    ["an unknown action", { action: "user.renamed" }],
    ["a malformed actor id", { actorUserId: "admin" }],
    ["an unknown key", { sort: "asc" }],
  ])("refuses %s", (_label, query) => {
    expect(auditEventListQuerySchema.safeParse(query).success).toBe(false);
  });
});
