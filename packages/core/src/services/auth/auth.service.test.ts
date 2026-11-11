import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { beforeAll, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { AuditService } from "../audit/audit.service";
import { UniqueConstraintViolationException, User, type EntityManager } from "@devmentor/db";
import { ConflictError, NotFoundError, TooManyRequestsError, UnauthorizedError, ValidationError } from "../../http/errors";
import { RateLimiter } from "../../rate-limiter";
import { FakeClock } from "../../testing/fake-clock";
import { AuthService, LOGIN_IP_RATE_LIMIT, LOGIN_RATE_LIMIT } from "./auth.service";

const SECRET = "s".repeat(32);
const PASSWORD = "correct horse battery";

function makeEm() {
  return { findOne: vi.fn(), create: vi.fn(), flush: vi.fn() };
}

describe("AuthService", () => {
  let passwordHash: string;
  let em: ReturnType<typeof makeEm>;
  let clock: FakeClock;
  let service: AuthService;
  let audit: { record: Mock<AuditService["record"]>; emit: Mock<AuditService["emit"]> };
  let logger: { error: Mock<(...args: unknown[]) => void> };

  function makeService(secret = SECRET) {
    return new AuthService({
      em: em as unknown as EntityManager,
      clock,
      rateLimiter: new RateLimiter({ clock }, LOGIN_RATE_LIMIT),
      loginIpLimiter: new RateLimiter({ clock }, LOGIN_IP_RATE_LIMIT),
      env: { AUTH_SECRET: secret },
      auditService: audit,
      logger,
    });
  }

  function login(email: string, password: string, ip = "1.1.1.1") {
    return service.login(email, password, ip);
  }

  function storedUser(overrides: Record<string, unknown> = {}) {
    return { id: "u1", email: "ada@example.com", name: "Ada", role: "mentee", passwordHash, ...overrides };
  }

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(() => {
    em = makeEm();
    clock = new FakeClock();
    audit = { record: vi.fn((_em, entry) => entry), emit: vi.fn() };
    logger = { error: vi.fn() };
    service = makeService();
  });

  describe("register", () => {
    it("stores a bcrypt hash (cost 12), a normalized e-mail and the mentee role, and returns no hash", async () => {
      em.create.mockImplementation((_entity, data) => ({ id: "u1", ...data }));

      const result = await service.register("  Ada@Example.COM ", "Ada", PASSWORD);

      expect(result).toEqual({ id: "u1", email: "ada@example.com", name: "Ada", role: "mentee" });
      const data = em.create.mock.calls[0]![1];
      expect(em.create).toHaveBeenCalledWith(User, expect.objectContaining({ email: "ada@example.com", role: "mentee" }));
      expect(data.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      expect(await bcrypt.compare(PASSWORD, data.passwordHash)).toBe(true);
      expect(em.flush).toHaveBeenCalledOnce();
    });

    it("refuses a duplicate e-mail with a conflict error", async () => {
      em.create.mockReturnValue({});
      em.flush.mockRejectedValue(new UniqueConstraintViolationException(new Error("duplicate")));

      await expect(service.register("ada@example.com", "Ada", PASSWORD)).rejects.toBeInstanceOf(ConflictError);
    });

    it("rethrows unexpected database errors", async () => {
      em.create.mockReturnValue({});
      em.flush.mockRejectedValue(new Error("connection lost"));

      await expect(service.register("ada@example.com", "Ada", PASSWORD)).rejects.toThrow("connection lost");
    });
  });

  describe("createMentorAccount", () => {
    it("creates a mentor with a hashed password on the em it is given and returns no hash", async () => {
      const otherEm = makeEm();
      otherEm.create.mockImplementation((_entity, data) => ({ id: "m1", ...data }));

      const result = await service.createMentorAccount(otherEm as unknown as EntityManager, " Mentor@Example.COM ", "Mia", PASSWORD);

      expect(result).toEqual({ id: "m1", email: "mentor@example.com", name: "Mia", role: "mentor" });
      const data = otherEm.create.mock.calls[0]![1];
      expect(data.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      expect(await bcrypt.compare(PASSWORD, data.passwordHash)).toBe(true);
      expect(otherEm.flush).toHaveBeenCalledOnce();
      expect(em.create).not.toHaveBeenCalled();
    });

    it("refuses an e-mail that already has an account with a conflict error", async () => {
      const otherEm = makeEm();
      otherEm.create.mockReturnValue({});
      otherEm.flush.mockRejectedValue(new UniqueConstraintViolationException(new Error("duplicate")));

      await expect(
        service.createMentorAccount(otherEm as unknown as EntityManager, "ada@example.com", "Ada", PASSWORD),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("setPassword", () => {
    it("resets the password of an existing account without changing its role", async () => {
      const user = storedUser({ passwordHash: null });
      em.findOne.mockResolvedValue(user);

      const result = await service.setPassword(" Ada@Example.com ", PASSWORD, { admin: false });

      expect(result).toEqual({ id: "u1", email: "ada@example.com", name: "Ada", role: "mentee" });
      expect(em.findOne).toHaveBeenCalledWith(User, { email: "ada@example.com" });
      expect(user.passwordHash).toMatch(/^\$2[aby]\$12\$/);
      expect(await bcrypt.compare(PASSWORD, user.passwordHash as string)).toBe(true);
      expect(em.flush).toHaveBeenCalledOnce();
    });

    it("revokes the account's existing sessions when the password is reset", async () => {
      const user = storedUser();
      em.findOne.mockResolvedValue(user);

      await service.setPassword("ada@example.com", PASSWORD, { admin: false });

      expect(user).toMatchObject({ sessionsRevokedAt: clock.now() });
    });

    it("promotes an existing account to admin with the admin option", async () => {
      em.findOne.mockResolvedValue(storedUser());

      const result = await service.setPassword("ada@example.com", PASSWORD, { admin: true });

      expect(result.role).toBe("admin");
    });

    it("creates an admin account for an unknown e-mail with the admin option", async () => {
      em.findOne.mockResolvedValue(null);
      em.create.mockImplementation((_entity, data) => ({ id: "u2", ...data }));

      const result = await service.setPassword("Root@Example.com", PASSWORD, { admin: true });

      expect(result).toEqual({ id: "u2", email: "root@example.com", name: "root", role: "admin" });
      expect(em.create).toHaveBeenCalledWith(User, expect.objectContaining({ role: "admin" }));
      expect(em.flush).toHaveBeenCalledOnce();
    });

    it("never creates a non-admin account", async () => {
      em.findOne.mockResolvedValue(null);

      await expect(service.setPassword("nobody@example.com", PASSWORD, { admin: false })).rejects.toBeInstanceOf(NotFoundError);
      expect(em.create).not.toHaveBeenCalled();
      expect(em.flush).not.toHaveBeenCalled();
    });

    it.each(["x".repeat(11), "x".repeat(129)])("rejects a password of %s characters outside 12-128", async (password) => {
      await expect(service.setPassword("ada@example.com", password, { admin: true })).rejects.toBeInstanceOf(ValidationError);
      expect(em.findOne).not.toHaveBeenCalled();
    });

    it("audits a CLI password reset in the same flush, without the e-mail", async () => {
      em.findOne.mockResolvedValue(storedUser());
      em.flush.mockImplementation(async () => expect(audit.record).toHaveBeenCalled());

      await service.setPassword("ada@example.com", PASSWORD, { admin: false });

      const entry = { action: "auth.password_set", actorKind: "cli", actorUserId: null, targetUserId: "u1" };
      expect(audit.record).toHaveBeenCalledWith(em, entry);
      expect(audit.emit).toHaveBeenCalledWith([entry]);
    });

    it.each([
      ["promotes an existing mentee", storedUser(), { promoted: true, created: false }],
      ["resets an existing admin", storedUser({ role: "admin" }), { promoted: false, created: false }],
      ["creates a new admin", null, { promoted: true, created: true }],
    ])("audits the admin password set when it %s", async (_label, existing, details) => {
      em.findOne.mockResolvedValue(existing);
      em.create.mockImplementation((_entity, data) => ({ id: "u1", ...data }));

      await service.setPassword("ada@example.com", PASSWORD, { admin: true });

      expect(audit.record).toHaveBeenCalledWith(em, { action: "auth.admin_password_set", actorKind: "cli", actorUserId: null, targetUserId: "u1", details });
    });

    it("logs no entry when the flush fails", async () => {
      em.findOne.mockResolvedValue(storedUser());
      em.flush.mockRejectedValue(new Error("db down"));

      await expect(service.setPassword("ada@example.com", PASSWORD, { admin: true })).rejects.toThrow("db down");
      expect(audit.emit).not.toHaveBeenCalled();
    });
  });

  describe("login audit", () => {
    it("records a failed login for a known account with its id and no e-mail", async () => {
      em.findOne.mockResolvedValue(storedUser());

      await expect(login("ada@example.com", "wrong password")).rejects.toBeInstanceOf(UnauthorizedError);

      const entry = { action: "auth.login_failed", actorKind: "anonymous", actorUserId: null, targetUserId: "u1" };
      expect(audit.record).toHaveBeenCalledWith(em, entry);
      expect(JSON.stringify(audit.record.mock.calls)).not.toContain("ada@example.com");
      expect(em.flush).toHaveBeenCalledOnce();
      expect(audit.emit).toHaveBeenCalledWith([entry]);
    });

    it("records a failed login for an unknown e-mail with a null target", async () => {
      em.findOne.mockResolvedValue(null);

      await expect(login("nobody@example.com", PASSWORD)).rejects.toBeInstanceOf(UnauthorizedError);

      expect(audit.record).toHaveBeenCalledWith(em, { action: "auth.login_failed", actorKind: "anonymous", actorUserId: null, targetUserId: null });
      expect(JSON.stringify(audit.record.mock.calls)).not.toContain("nobody@example.com");
    });

    it("keeps the same 401 when the entry cannot be written, and logs the failure without the e-mail", async () => {
      em.findOne.mockResolvedValue(storedUser());
      em.flush.mockRejectedValue(new Error("db down"));

      await expect(login("ada@example.com", "wrong password")).rejects.toMatchObject({ code: "unauthorized", message: "Invalid email or password" });

      expect(audit.emit).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ targetUserId: "u1" }), "audit: failed login could not be recorded");
      expect(JSON.stringify(logger.error.mock.calls)).not.toContain("ada@example.com");
    });

    it("writes nothing for a successful login", async () => {
      em.findOne.mockResolvedValue(storedUser());

      await login("ada@example.com", PASSWORD);

      expect(audit.record).not.toHaveBeenCalled();
      expect(em.flush).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("returns the session user for the correct password", async () => {
      em.findOne.mockResolvedValue(storedUser());

      const result = await login("Ada@Example.com", PASSWORD);

      expect(result).toEqual({ id: "u1", email: "ada@example.com", name: "Ada", role: "mentee" });
      expect(em.findOne).toHaveBeenCalledWith(User, { email: "ada@example.com" });
    });

    it("rejects a wrong password with the generic error", async () => {
      em.findOne.mockResolvedValue(storedUser());

      await expect(login("ada@example.com", "wrong password")).rejects.toMatchObject({
        code: "unauthorized",
        message: "Invalid email or password",
      });
    });

    it("rejects an unknown e-mail with the same generic error and still compares a hash", async () => {
      em.findOne.mockResolvedValue(null);
      const compare = vi.spyOn(bcrypt, "compare");

      const error = await login("nobody@example.com", PASSWORD).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toMatchObject({ message: "Invalid email or password" });
      expect(compare).toHaveBeenCalledOnce();
    });

    it("rejects an account without a password the same way", async () => {
      em.findOne.mockResolvedValue(storedUser({ passwordHash: null }));

      await expect(login("ada@example.com", PASSWORD)).rejects.toMatchObject({
        message: "Invalid email or password",
      });
    });

    it("computes the dummy hash only once", async () => {
      em.findOne.mockResolvedValue(null);
      const hash = vi.spyOn(bcrypt, "hash");

      await login("a@example.com", PASSWORD).catch(() => undefined);
      await login("b@example.com", PASSWORD).catch(() => undefined);

      expect(hash).toHaveBeenCalledOnce();
    });

    it("blocks further attempts after 5 failures, even with the right password", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 5; i += 1) {
        await login("ada@example.com", "wrong").catch(() => undefined);
      }

      await expect(login("ADA@example.com", PASSWORD)).rejects.toBeInstanceOf(TooManyRequestsError);
    });

    it("allows attempts again once the window has passed", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 5; i += 1) {
        await login("ada@example.com", "wrong").catch(() => undefined);
      }
      clock.advance(LOGIN_RATE_LIMIT.windowMs + 1);

      await expect(login("ada@example.com", PASSWORD)).resolves.toMatchObject({ id: "u1" });
    });

    it("forgets earlier failures after a successful login", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 4; i += 1) {
        await login("ada@example.com", "wrong").catch(() => undefined);
      }
      await login("ada@example.com", PASSWORD);

      for (let i = 0; i < 4; i += 1) {
        await login("ada@example.com", "wrong").catch(() => undefined);
      }

      await expect(login("ada@example.com", PASSWORD)).resolves.toMatchObject({ id: "u1" });
    });

    it("does not let failures from one IP lock the same account for another IP", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 5; i += 1) await login("ada@example.com", "wrong", "10.0.0.1").catch(() => undefined);

      await expect(login("ada@example.com", PASSWORD, "10.0.0.2")).resolves.toMatchObject({ id: "u1" });
    });

    it("caps failed attempts from one IP across different email addresses", async () => {
      em.findOne.mockResolvedValue(null);
      for (let i = 0; i < LOGIN_IP_RATE_LIMIT.maxAttempts; i += 1) {
        await login(`spray-${i}@example.com`, "wrong", "10.0.0.3").catch(() => undefined);
      }

      await expect(login("another@example.com", PASSWORD, "10.0.0.3")).rejects.toBeInstanceOf(TooManyRequestsError);
    }, 30_000);
  });

  describe("tokens", () => {
    it("round-trips: a token issued for a user verifies to the user id", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentor" });

      await expect(service.verifyToken(token)).resolves.toBe("u1");
    });

    it("carries the role and a 24 h expiry as claims", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentor" });

      const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString());
      expect(payload).toMatchObject({ sub: "u1", role: "mentor" });
      expect(payload.exp - payload.iat).toBe(24 * 60 * 60);
    });

    it("rejects an expired token", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentee" });
      clock.advance(24 * 60 * 60 * 1000 + 1000);

      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects a tampered token", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentee" });
      const [header, , signature] = token.split(".");
      const forgedPayload = Buffer.from(JSON.stringify({ sub: "u2", role: "admin", exp: 9999999999 })).toString("base64url");

      await expect(service.verifyToken(`${header}.${forgedPayload}.${signature}`)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it("rejects a token signed with another secret", async () => {
      const token = await makeService("o".repeat(32)).issueToken({ id: "u1", role: "mentee" });

      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects a malformed token", async () => {
      await expect(service.verifyToken("not-a-token")).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects a token without a subject", async () => {
      const issuedAt = Math.floor(clock.now().getTime() / 1000);
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(issuedAt + 60)
        .sign(new TextEncoder().encode(SECRET));

      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects a token using another algorithm", async () => {
      const issuedAt = Math.floor(clock.now().getTime() / 1000);
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: "HS512" })
        .setSubject("u1")
        .setExpirationTime(issuedAt + 60)
        .sign(new TextEncoder().encode(SECRET));

      await expect(service.verifyToken(token)).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("authenticate", () => {
    it("returns the freshly loaded user, so the current role wins over the token's", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentee" });
      em.findOne.mockResolvedValue(storedUser({ role: "admin" }));

      const result = await service.authenticate(token);

      expect(result).toEqual({ id: "u1", email: "ada@example.com", name: "Ada", role: "admin" });
      expect(em.findOne).toHaveBeenCalledWith(User, { id: "u1" });
    });

    it("rejects a valid token whose user no longer exists", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentee" });
      em.findOne.mockResolvedValue(null);

      await expect(service.authenticate(token)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejects an invalid token without touching the database", async () => {
      await expect(service.authenticate("garbage")).rejects.toBeInstanceOf(UnauthorizedError);
      expect(em.findOne).not.toHaveBeenCalled();
    });

    it("rejects a token issued before the user's sessions were revoked", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentee" });
      clock.advance(60_000);
      em.findOne.mockResolvedValue(storedUser({ sessionsRevokedAt: clock.now() }));

      await expect(service.authenticate(token)).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("orders a logout and a login within the same second by milliseconds", async () => {
      const before = await service.issueToken({ id: "u1", role: "mentee" });
      clock.advance(300);
      em.findOne.mockResolvedValue(storedUser({ sessionsRevokedAt: clock.now() }));
      clock.advance(300);
      const after = await service.issueToken({ id: "u1", role: "mentee" });

      await expect(service.authenticate(before)).rejects.toBeInstanceOf(UnauthorizedError);
      await expect(service.authenticate(after)).resolves.toMatchObject({ id: "u1" });
    });

    it("falls back to the second-precision iat for a token issued before iatMs existed", async () => {
      const issuedAt = Math.floor(clock.now().getTime() / 1000);
      const legacy = await new SignJWT({ role: "mentee" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject("u1")
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + 60)
        .sign(new TextEncoder().encode(SECRET));
      clock.advance(5_000);
      em.findOne.mockResolvedValue(storedUser({ sessionsRevokedAt: clock.now() }));

      await expect(service.authenticate(legacy)).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("revokeSessions", () => {
    it("revokes every session of the token's user", async () => {
      const token = await service.issueToken({ id: "u1", role: "mentee" });
      const user = storedUser();
      em.findOne.mockResolvedValue(user);

      await service.revokeSessions(token);

      expect(em.findOne).toHaveBeenCalledWith(User, { id: "u1" });
      expect(user).toMatchObject({ sessionsRevokedAt: clock.now() });
      expect(em.flush).toHaveBeenCalledOnce();
    });

    it("does nothing for a missing, invalid or orphaned token", async () => {
      await service.revokeSessions(undefined);
      await service.revokeSessions("garbage");
      em.findOne.mockResolvedValue(null);
      await service.revokeSessions(await service.issueToken({ id: "gone", role: "mentee" }));

      expect(em.flush).not.toHaveBeenCalled();
    });
  });
});
