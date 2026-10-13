import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("UserService", () => {
  let em: ReturnType<typeof makeEm>;
  let service: UserService;

  beforeEach(() => {
    em = makeEm();
    service = new UserService({ em: em as unknown as EntityManager });
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

    const result = await service.create({ name: "Ada", email: "  Ada@Example.COM ", role: "mentor" });

    expect(em.create).toHaveBeenCalledWith(User, { name: "Ada", email: "ada@example.com", role: "mentor" });
    expect(em.flush).toHaveBeenCalled();
    expect(result).toEqual(dto);
  });

  it("maps a unique violation on create to a ConflictError on the email field", async () => {
    em.create.mockImplementation((_entity, data) => makeUser(data));
    em.flush.mockRejectedValue(new UniqueConstraintViolationException(new Error("duplicate key")));

    const error = await service.create({ name: "Ada", email: "ada@example.com", role: "mentor" }).catch((e) => e);

    expect(error).toBeInstanceOf(ConflictError);
    expect(error.fieldErrors).toEqual({ email: ["A user with this email already exists"] });
  });

  it("rethrows other database errors", async () => {
    const failure = new Error("connection lost");
    em.create.mockImplementation((_entity, data) => makeUser(data));
    em.flush.mockRejectedValue(failure);

    await expect(service.create({ name: "Ada", email: "ada@example.com", role: "mentor" })).rejects.toBe(failure);
  });

  it("updates explicit fields of an existing user", async () => {
    const user = makeUser();
    em.findOne.mockResolvedValue(user);

    const result = await service.update("u1", { name: "Ada L.", email: "ADA@example.com", role: "admin" });

    expect(user).toMatchObject({ name: "Ada L.", email: "ada@example.com", role: "admin" });
    expect(em.flush).toHaveBeenCalled();
    expect(result).toMatchObject({ name: "Ada L.", role: "admin" });
  });

  it("throws NotFoundError when updating an unknown user", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.update("missing", { name: "A", email: "a@a.io", role: "mentee" })).rejects.toThrow(NotFoundError);
    expect(em.flush).not.toHaveBeenCalled();
  });

  it("deletes an existing user", async () => {
    const user = makeUser();
    em.findOne.mockResolvedValue(user);

    await service.delete("u1");

    expect(em.remove).toHaveBeenCalledWith(user);
    expect(em.flush).toHaveBeenCalled();
  });

  it("throws NotFoundError when deleting an unknown user", async () => {
    em.findOne.mockResolvedValue(null);

    await expect(service.delete("missing")).rejects.toThrow(NotFoundError);
    expect(em.remove).not.toHaveBeenCalled();
  });
});
