import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditEvent, User, type EntityManager } from "@devmentor/db";
import { ForbiddenError } from "../../http/errors";
import { FakeClock } from "../../testing/fake-clock";
import { AuditService } from "./audit.service";

const NOW = new Date("2026-11-11T10:00:00.000Z");
const admin = { id: "admin-1", email: "a@a.io", name: "Admin", role: "admin" as const };

function makeEm() {
  return { create: vi.fn(), findAndCount: vi.fn(), find: vi.fn() };
}

function event(overrides: Record<string, unknown> = {}) {
  return {
    id: "e1",
    occurredAt: NOW,
    action: "user.role_changed",
    actorKind: "admin",
    actorUserId: "admin-1",
    targetUserId: "u1",
    details: { from: "mentee", to: "mentor" },
    ...overrides,
  };
}

describe("AuditService", () => {
  let em: ReturnType<typeof makeEm>;
  let logger: { info: ReturnType<typeof vi.fn> };
  let service: AuditService;

  beforeEach(() => {
    em = makeEm();
    logger = { info: vi.fn() };
    service = new AuditService({ em: em as unknown as EntityManager, clock: new FakeClock(NOW), logger: logger as never });
  });

  describe("record", () => {
    it("queues the row on the caller's unit of work with the clock's time, and returns the entry", () => {
      const tx = makeEm();
      const entry = { action: "user.deleted" as const, actorKind: "admin" as const, actorUserId: "admin-1", targetUserId: "u1", details: { role: "mentor" } };

      expect(service.record(tx as unknown as EntityManager, entry)).toBe(entry);

      expect(tx.create).toHaveBeenCalledWith(AuditEvent, { occurredAt: NOW, ...entry });
      expect(em.create).not.toHaveBeenCalled();
    });

    it("stores empty details when the entry has none", () => {
      service.record(em as unknown as EntityManager, { action: "auth.password_set", actorKind: "cli", actorUserId: null, targetUserId: "u1" });

      expect(em.create).toHaveBeenCalledWith(AuditEvent, expect.objectContaining({ details: {} }));
    });
  });

  describe("emit", () => {
    it("logs each committed entry as one structured line", () => {
      service.emit([
        { action: "auth.login_failed", actorKind: "anonymous", actorUserId: null, targetUserId: null },
        { action: "user.deleted", actorKind: "admin", actorUserId: "admin-1", targetUserId: "u1", details: { role: "mentee" } },
      ]);

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenNthCalledWith(1, { audit: { action: "auth.login_failed", actorKind: "anonymous", actorUserId: null, targetUserId: null, details: {} } }, "audit");
      expect(logger.info).toHaveBeenNthCalledWith(2, { audit: expect.objectContaining({ action: "user.deleted", details: { role: "mentee" } }) }, "audit");
    });

    it("logs nothing for no entries", () => {
      service.emit([]);

      expect(logger.info).not.toHaveBeenCalled();
    });
  });

  describe("list", () => {
    it("pages newest first and resolves actor and target in one batched lookup", async () => {
      em.findAndCount.mockResolvedValue([[event(), event({ id: "e2", actorUserId: "admin-1", targetUserId: "gone" })], 42]);
      em.find.mockResolvedValue([
        { id: "admin-1", name: "Admin", email: "a@a.io" },
        { id: "u1", name: "Ada", email: "ada@example.com" },
      ]);

      const page = await service.list(admin, { page: 2, pageSize: 20 });

      expect(em.findAndCount).toHaveBeenCalledWith(AuditEvent, {}, { orderBy: { occurredAt: "desc", id: "desc" }, limit: 20, offset: 20 });
      expect(em.find).toHaveBeenCalledOnce();
      expect(em.find).toHaveBeenCalledWith(User, { id: { $in: ["admin-1", "u1", "gone"] } });
      expect(page).toEqual({
        total: 42,
        page: 2,
        pageSize: 20,
        items: [
          {
            id: "e1",
            occurredAt: NOW.toISOString(),
            action: "user.role_changed",
            actorKind: "admin",
            actor: { id: "admin-1", name: "Admin", email: "a@a.io" },
            target: { id: "u1", name: "Ada", email: "ada@example.com" },
            details: { from: "mentee", to: "mentor" },
          },
          expect.objectContaining({ id: "e2", target: { id: "gone", deleted: true } }),
        ],
      });
    });

    it("shows no actor for the CLI and failed logins, and skips the user lookup when no ids are left", async () => {
      em.findAndCount.mockResolvedValue([[event({ actorKind: "anonymous", actorUserId: null, targetUserId: null, action: "auth.login_failed", details: {} })], 1]);

      const page = await service.list(admin, { page: 1, pageSize: 20 });

      expect(em.find).not.toHaveBeenCalled();
      expect(page.items[0]).toMatchObject({ actor: null, target: null, actorKind: "anonymous" });
    });

    it("filters by action and actor", async () => {
      em.findAndCount.mockResolvedValue([[], 0]);

      await service.list(admin, { page: 1, pageSize: 100, action: "user.deleted", actorUserId: "admin-1" });

      expect(em.findAndCount).toHaveBeenCalledWith(AuditEvent, { action: "user.deleted", actorUserId: "admin-1" }, expect.objectContaining({ limit: 100, offset: 0 }));
    });

    it.each(["mentor", "mentee"] as const)("refuses a %s before reading anything", async (role) => {
      await expect(service.list({ ...admin, role }, { page: 1, pageSize: 20 })).rejects.toBeInstanceOf(ForbiddenError);
      expect(em.findAndCount).not.toHaveBeenCalled();
    });
  });
});
