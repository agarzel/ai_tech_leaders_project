import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MentorInvitation, User, type EntityManager } from "@devmentor/db";
import { NotFoundError, TooManyRequestsError } from "../../http/errors";
import { RateLimiter } from "../../rate-limiter";
import { FakeClock } from "../../testing/fake-clock";
import { INVITATION_RATE_LIMITS, INVITATION_TTL_MS, InvitationService } from "./invitation.service";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function makeEm() {
  const em = {
    find: vi.fn(),
    nativeUpdate: vi.fn(),
    create: vi.fn(),
    flush: vi.fn(),
    getReference: vi.fn((entity: unknown, id: string) => ({ ref: id })),
    findOne: vi.fn(),
    findOneOrFail: vi.fn(),
    transactional: vi.fn(),
  };
  // The transaction callback receives the same (mock) EntityManager.
  em.transactional.mockImplementation((work: (tx: unknown) => unknown) => work(em));
  return em;
}

let em: ReturnType<typeof makeEm>;
let clock: FakeClock;
let service: InvitationService;
let previewLimiter: RateLimiter;
let registrationLimiter: RateLimiter;

beforeEach(() => {
  em = makeEm();
  clock = new FakeClock(new Date("2026-10-23T10:00:00.000Z"));
  previewLimiter = new RateLimiter({ clock }, INVITATION_RATE_LIMITS.preview);
  registrationLimiter = new RateLimiter({ clock }, INVITATION_RATE_LIMITS.registration);
  service = new InvitationService({
    em: em as unknown as EntityManager,
    clock,
    invitationPreviewLimiter: previewLimiter,
    invitationRegistrationLimiter: registrationLimiter,
  });
});

describe("InvitationService.create", () => {
  beforeEach(() => {
    em.create.mockImplementation((_entity: unknown, data: Record<string, unknown>) => ({ id: "inv1", ...data }));
  });

  it("stores the SHA-256 hash of the token, never the token, and returns the token once", async () => {
    const result = await service.create("admin1", "ada@example.com");

    const data = em.create.mock.calls[0]![1] as Record<string, unknown>;
    expect(em.create.mock.calls[0]![0]).toBe(MentorInvitation);
    expect(data.tokenHash).toBe(sha256(result.token));
    expect(Object.values(data)).not.toContain(result.token);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result).toEqual({
      id: "inv1",
      email: "ada@example.com",
      expiresAt: new Date("2026-11-06T10:00:00.000Z").toISOString(),
      token: result.token,
    });
  });

  it("generates a different token every time", async () => {
    const first = await service.create("admin1", "ada@example.com");
    const second = await service.create("admin1", "ada@example.com");

    expect(first.token).not.toBe(second.token);
  });

  it("normalizes the email, sets the expiry from the clock and records the inviting admin", async () => {
    await service.create("admin1", "  Ada@Example.COM ");

    expect(em.getReference).toHaveBeenCalledWith(User, "admin1");
    expect(em.create).toHaveBeenCalledWith(MentorInvitation, {
      email: "ada@example.com",
      tokenHash: expect.any(String),
      expiresAt: new Date(clock.now().getTime() + INVITATION_TTL_MS),
      createdBy: { ref: "admin1" },
    });
  });

  it("revokes older open invitations for the same email in the same transaction, before creating the new one", async () => {
    await service.create("admin1", "Ada@example.com");

    expect(em.transactional).toHaveBeenCalledTimes(1);
    expect(em.nativeUpdate).toHaveBeenCalledWith(
      MentorInvitation,
      { email: "ada@example.com", usedAt: null, revokedAt: null },
      { revokedAt: clock.now() },
    );
    expect(em.nativeUpdate.mock.invocationCallOrder[0]).toBeLessThan(em.create.mock.invocationCallOrder[0]!);
    expect(em.flush).toHaveBeenCalledTimes(1);
  });

  it("propagates a database failure", async () => {
    em.flush.mockRejectedValue(new Error("db down"));

    await expect(service.create("admin1", "ada@example.com")).rejects.toThrow("db down");
  });
});

describe("InvitationService.verify", () => {
  const open = () => ({
    email: "ada@example.com",
    expiresAt: new Date("2026-11-06T10:00:00.000Z"),
    usedAt: null,
    revokedAt: null,
  });

  it("returns the email and expiry of an open invitation, looked up by the token hash", async () => {
    em.findOne.mockResolvedValue(open());

    const preview = await service.verify("raw-token");

    expect(em.findOne).toHaveBeenCalledWith(MentorInvitation, { tokenHash: sha256("raw-token") });
    expect(preview).toEqual({ email: "ada@example.com", expiresAt: "2026-11-06T10:00:00.000Z" });
  });

  it.each([
    ["unknown", null],
    ["expired", { ...open(), expiresAt: new Date("2026-10-23T09:59:59.000Z") }],
    ["expiring exactly now", { ...open(), expiresAt: new Date("2026-10-23T10:00:00.000Z") }],
    ["used", { ...open(), usedAt: new Date("2026-10-22T10:00:00.000Z") }],
    ["revoked", { ...open(), revokedAt: new Date("2026-10-22T10:00:00.000Z") }],
  ])("refuses a %s token with the same generic error", async (_label, row) => {
    em.findOne.mockResolvedValue(row);

    const failure = await service.verify("raw-token").catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(NotFoundError);
    expect((failure as NotFoundError).message).toBe("This invitation is no longer valid");
  });
});

describe("InvitationService.consume", () => {
  it("claims the invitation conditionally, creates the account in the same transaction and records who used it", async () => {
    em.nativeUpdate.mockResolvedValue(1);
    em.findOneOrFail.mockResolvedValue({ id: "inv1", email: "ada@example.com" });
    const createAccount = vi.fn().mockResolvedValue({ id: "user1" });

    const account = await service.consume("raw-token", createAccount);

    expect(account).toEqual({ id: "user1" });
    expect(em.transactional).toHaveBeenCalledTimes(1);
    expect(em.nativeUpdate).toHaveBeenNthCalledWith(
      1,
      MentorInvitation,
      { tokenHash: sha256("raw-token"), usedAt: null, revokedAt: null, expiresAt: { $gt: clock.now() } },
      { usedAt: clock.now() },
    );
    expect(createAccount).toHaveBeenCalledWith(em, "ada@example.com");
    expect(em.nativeUpdate).toHaveBeenNthCalledWith(2, MentorInvitation, { id: "inv1" }, { usedBy: { ref: "user1" } });
  });

  it("refuses an invitation that is not open and never creates the account", async () => {
    em.nativeUpdate.mockResolvedValue(0);
    const createAccount = vi.fn();

    await expect(service.consume("raw-token", createAccount)).rejects.toThrow(NotFoundError);

    expect(createAccount).not.toHaveBeenCalled();
    expect(em.findOneOrFail).not.toHaveBeenCalled();
  });

  it("propagates an account-creation failure so the transaction rolls back", async () => {
    em.nativeUpdate.mockResolvedValue(1);
    em.findOneOrFail.mockResolvedValue({ id: "inv1", email: "ada@example.com" });
    const createAccount = vi.fn().mockRejectedValue(new Error("email taken"));

    await expect(service.consume("raw-token", createAccount)).rejects.toThrow("email taken");

    expect(em.nativeUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("InvitationService.guardPreview", () => {
  it("allows 20 previews per IP and refuses the 21st", () => {
    for (let i = 0; i < 20; i += 1) service.guardPreview("1.1.1.1");

    expect(() => service.guardPreview("1.1.1.1")).toThrow(TooManyRequestsError);
  });

  it("counts every IP separately and forgets after the 15-minute window", () => {
    for (let i = 0; i < 20; i += 1) service.guardPreview("1.1.1.1");

    expect(() => service.guardPreview("2.2.2.2")).not.toThrow();
    clock.advance(15 * 60_000);
    expect(() => service.guardPreview("1.1.1.1")).not.toThrow();
  });
});

describe("InvitationService.guardRegistration", () => {
  const fail = () => Promise.reject(new NotFoundError("nope"));

  it("returns the result and does not count a success", async () => {
    for (let i = 0; i < 15; i += 1) {
      await expect(service.guardRegistration("1.1.1.1", () => Promise.resolve("ok"))).resolves.toBe("ok");
    }

    expect(registrationLimiter.check("1.1.1.1").allowed).toBe(true);
  });

  it("rethrows the original error and refuses the IP after 10 failures", async () => {
    for (let i = 0; i < 10; i += 1) {
      await expect(service.guardRegistration("1.1.1.1", fail)).rejects.toBeInstanceOf(NotFoundError);
    }
    const work = vi.fn(() => Promise.resolve("ok"));

    await expect(service.guardRegistration("1.1.1.1", work)).rejects.toBeInstanceOf(TooManyRequestsError);
    expect(work).not.toHaveBeenCalled();
    await expect(service.guardRegistration("2.2.2.2", work)).resolves.toBe("ok");
  });

  it("forgets the failures after one hour", async () => {
    for (let i = 0; i < 10; i += 1) await service.guardRegistration("1.1.1.1", fail).catch(() => undefined);
    clock.advance(60 * 60_000);

    await expect(service.guardRegistration("1.1.1.1", () => Promise.resolve("ok"))).resolves.toBe("ok");
  });
});

describe("InvitationService.listForAdmin", () => {
  const HOUR = 60 * 60_000;
  const created = new Date("2026-10-22T10:00:00.000Z");
  const future = new Date(clockNow().getTime() + HOUR);
  const past = new Date(clockNow().getTime() - HOUR);

  function clockNow() {
    return new Date("2026-10-23T10:00:00.000Z");
  }

  function row(overrides: Record<string, unknown>) {
    return {
      id: "i",
      email: "a@example.com",
      tokenHash: "secret-hash",
      createdAt: created,
      expiresAt: future,
      usedAt: null,
      revokedAt: null,
      createdBy: { name: "Admin One", email: "admin@example.com" },
      ...overrides,
    };
  }

  it("queries newest first with the issuing admin loaded", async () => {
    em.find.mockResolvedValue([]);

    await expect(service.listForAdmin()).resolves.toEqual([]);
    expect(em.find).toHaveBeenCalledWith(
      MentorInvitation,
      {},
      { populate: ["createdBy"], orderBy: { createdAt: "desc" } },
    );
  });

  it.each([
    ["pending", {}],
    ["expired", { expiresAt: past }],
    ["revoked", { revokedAt: past }],
    ["revoked", { revokedAt: past, expiresAt: past }],
    ["used", { usedAt: past }],
    ["used", { usedAt: past, expiresAt: past }],
    ["used", { usedAt: past, revokedAt: past }],
  ])("reports %s for %j", async (status, overrides) => {
    em.find.mockResolvedValue([row(overrides)]);

    const [item] = await service.listForAdmin();

    expect(item!.status).toBe(status);
  });

  it("maps dates to ISO strings, names the admin and never exposes the token hash", async () => {
    em.find.mockResolvedValue([row({})]);

    const [item] = await service.listForAdmin();

    expect(item).toEqual({
      id: "i",
      email: "a@example.com",
      status: "pending",
      createdAt: created.toISOString(),
      expiresAt: future.toISOString(),
      createdBy: "Admin One",
    });
    expect(JSON.stringify(item)).not.toContain("secret-hash");
  });

  it("falls back to the admin's e-mail, and to null when the admin was deleted", async () => {
    em.find.mockResolvedValue([
      row({ createdBy: { name: "", email: "admin@example.com" } }),
      row({ createdBy: null }),
    ]);

    const items = await service.listForAdmin();

    expect(items.map((item) => item.createdBy)).toEqual(["admin@example.com", null]);
  });
});
