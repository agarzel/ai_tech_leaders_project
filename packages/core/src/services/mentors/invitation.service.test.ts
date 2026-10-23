import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MentorInvitation, User, type EntityManager } from "@devmentor/db";
import { NotFoundError } from "../../http/errors";
import { FakeClock } from "../../testing/fake-clock";
import { INVITATION_TTL_MS, InvitationService } from "./invitation.service";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function makeEm() {
  const em = {
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

beforeEach(() => {
  em = makeEm();
  clock = new FakeClock(new Date("2026-10-23T10:00:00.000Z"));
  service = new InvitationService({ em: em as unknown as EntityManager, clock });
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
