import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { CrudContext } from "../../http/crud";
import type { AuditService } from "../audit/audit.service";
import { UniqueConstraintViolationException, User, type EntityManager } from "@devmentor/db";
import { ConflictError, NotFoundError } from "../../http/errors";
import { UserService } from "./user.service";

const created = new Date("2026-10-13T10:00:00.000Z");
const updated = new Date("2026-10-13T11:00:00.000Z");

function makeUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "u1",
    email: "ada@example.com",
    name: "Ada",
    role: "mentor",
    createdAt: created,
    updatedAt: updated,
    ...overrides,
  };
}

const dto = {
  id: "u1",
  email: "ada@example.com",
  name: "Ada",
  role: "mentor",
  createdAt: created.toISOString(),
  updatedAt: updated.toISOString(),
};

function makeEm() {
  const em = {
    findAndCount: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    flush: vi.fn(),
    remove: vi.fn(),
  };
  em.remove.mockReturnValue({ flush: em.flush });
  return em;
}

const admin = { actorUserId: "admin-1" };
// A direct caller that leaves the actor out: the type forbids it, the runtime check is the defence behind it.
const missingActor = undefined as unknown as CrudContext;

describe("UserService", () => {
  let em: ReturnType<typeof makeEm>;
  let audit: { record: Mock<AuditService["record"]>; emit: Mock<AuditService["emit"]> };
  let service: UserService;

  beforeEach(() => {
    em = makeEm();
    audit = { record: vi.fn((_em, entry) => entry), emit: vi.fn() };
    service = new UserService({ em: em as unknown as EntityManager, auditService: audit });
  });

  it("lists a page of users, newest first, as DTOs", async () => {
    em.findAndCount.mockResolvedValue([[makeUser()], 21]);

    const page = await service.list({ page: 3, pageSize: 10 });

    expect(em.findAndCount).toHaveBeenCalledWith(User, {}, { orderBy: { createdAt: "desc" }, limit: 10, offset: 20 });
    expect(page).toEqual({ items: [dto], total: 21, page: 3, pageSize: 10 });
  });

  it("gets a user by id", async () => {
    em.findOne.mockResolvedValue(makeUser());

    await expect(service.get("u1")).resolves.toEqual(dto);
    expect(em.findOne).toHaveBeenCalledWith(User, { id: "u1" });
  });

  it("throws NotFoundError for an unknown id", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.get("missing")).rejects.toThrow(new NotFoundError("User not found"));
  });

  it("creates a user from explicit fields with a normalized email", async () => {
    em.create.mockImplementation((_entity, data) => makeUser(data));

    const result = await service.create({ name: "Ada", email: "  Ada@Example.COM ", role: "mentor" }, admin);

    expect(em.create).toHaveBeenCalledWith(User, { name: "Ada", email: "ada@example.com", role: "mentor" });
    expect(em.flush).toHaveBeenCalled();
    expect(result).toEqual(dto);
  });

  it("audits a user created by an admin with the role it grants, in the same flush, then logs it", async () => {
    em.create.mockImplementation((_entity, data) => makeUser(data));
    em.flush.mockImplementation(async () => expect(audit.record).toHaveBeenCalled());

    await service.create({ name: "Root", email: "root@example.com", role: "admin" }, admin);

    const entry = { action: "user.created", actorKind: "admin", actorUserId: "admin-1", targetUserId: "u1", details: { role: "admin" } };
    expect(audit.record).toHaveBeenCalledWith(em, entry);
    expect(audit.emit).toHaveBeenCalledWith([entry]);
  });

  it("refuses a create without the acting admin before touching the database", async () => {
    await expect(service.create({ name: "A", email: "a@a.io", role: "admin" }, missingActor)).rejects.toThrow("UserService.create needs the acting admin");
    expect(em.create).not.toHaveBeenCalled();
  });

  it("maps a unique violation on create to a ConflictError on the email field", async () => {
    em.create.mockImplementation((_entity, data) => makeUser(data));
    em.flush.mockRejectedValue(new UniqueConstraintViolationException(new Error("duplicate key")));

    const error = await service.create({ name: "Ada", email: "ada@example.com", role: "mentor" }, admin).catch((e) => e);

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.fieldErrors).toEqual({ email: ["A user with this email already exists"] });
  });

  it("rethrows other database errors", async () => {
    const failure = new Error("connection lost");
    em.create.mockImplementation((_entity, data) => makeUser(data));
    em.flush.mockRejectedValue(failure);

    await expect(service.create({ name: "Ada", email: "ada@example.com", role: "mentor" }, admin)).rejects.toBe(failure);
  });

  it("updates explicit fields and audits the role change in the same flush, then logs it", async () => {
    const user = makeUser();
    em.findOne.mockResolvedValue(user);
    em.flush.mockImplementation(async () => expect(audit.record).toHaveBeenCalled());

    const result = await service.update("u1", { name: "Ada L.", email: "ADA@example.com", role: "admin" }, admin);

    expect(user).toMatchObject({ name: "Ada L.", email: "ada@example.com", role: "admin" });
    const entry = { action: "user.role_changed", actorKind: "admin", actorUserId: "admin-1", targetUserId: "u1", details: { from: "mentor", to: "admin" } };
    expect(audit.record).toHaveBeenCalledWith(em, entry);
    expect(audit.emit).toHaveBeenCalledWith([entry]);
    expect(result).toMatchObject({ name: "Ada L.", role: "admin" });
  });

  it("writes no role entry when the role stays the same (name and e-mail edits are not audited)", async () => {
    em.findOne.mockResolvedValue(makeUser());

    await service.update("u1", { name: "Ada L.", email: "ada@example.com", role: "mentor" }, admin);

    expect(audit.record).not.toHaveBeenCalled();
    expect(audit.emit).toHaveBeenCalledWith([]);
    expect(em.flush).toHaveBeenCalled();
  });

  it("logs nothing when the flush that would write the change and its entry fails", async () => {
    em.findOne.mockResolvedValue(makeUser());
    em.flush.mockRejectedValue(uniqueViolation());

    await expect(service.update("u1", { name: "A", email: "taken@a.io", role: "admin" }, admin)).rejects.toThrow(ConflictError);
    expect(audit.emit).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when updating an unknown user", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.update("missing", { name: "A", email: "a@a.io", role: "mentee" }, admin)).rejects.toThrow(NotFoundError);
    expect(em.flush).not.toHaveBeenCalled();
  });

  it.each([undefined, { actorUserId: "" }])("refuses an update without the acting admin (%j) before touching the database", async (context) => {
    await expect(service.update("u1", { name: "A", email: "a@a.io", role: "admin" }, context as CrudContext)).rejects.toThrow("UserService.update needs the acting admin");
    expect(em.findOne).not.toHaveBeenCalled();
  });

  it("deletes an existing user and audits it, with the id and role kept in the entry", async () => {
    const user = makeUser();
    em.findOne.mockResolvedValue(user);

    await service.delete("u1", admin);

    expect(em.remove).toHaveBeenCalledWith(user);
    const entry = { action: "user.deleted", actorKind: "admin", actorUserId: "admin-1", targetUserId: "u1", details: { role: "mentor" } };
    expect(audit.record).toHaveBeenCalledWith(em, entry);
    expect(em.flush).toHaveBeenCalled();
    expect(audit.emit).toHaveBeenCalledWith([entry]);
  });

  it("logs nothing when the delete is refused by the database", async () => {
    em.findOne.mockResolvedValue(makeUser());
    em.flush.mockRejectedValue(new Error("violates foreign key constraint"));

    await expect(service.delete("u1", admin)).rejects.toThrow("violates foreign key constraint");
    expect(audit.emit).not.toHaveBeenCalled();
  });

  it("throws NotFoundError when deleting an unknown user", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.delete("missing", admin)).rejects.toThrow(NotFoundError);
    expect(em.remove).not.toHaveBeenCalled();
  });

  it("refuses a delete without the acting admin", async () => {
    await expect(service.delete("u1", missingActor)).rejects.toThrow("UserService.delete needs the acting admin");
    expect(em.findOne).not.toHaveBeenCalled();
  });
});

function uniqueViolation() {
  return new UniqueConstraintViolationException(new Error("duplicate key"));
}
