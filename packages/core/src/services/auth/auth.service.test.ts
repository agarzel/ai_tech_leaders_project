import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { UniqueConstraintViolationException, User, type EntityManager } from "@devmentor/db";
import { ConflictError, TooManyRequestsError, UnauthorizedError } from "../../http/errors";
import { RateLimiter } from "../../rate-limiter";
import { FakeClock } from "../../testing/fake-clock";
import { AuthService, LOGIN_RATE_LIMIT } from "./auth.service";

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

  function makeService(secret = SECRET) {
    return new AuthService({
      em: em as unknown as EntityManager,
      clock,
      rateLimiter: new RateLimiter({ clock }, LOGIN_RATE_LIMIT),
      env: { AUTH_SECRET: secret },
    });
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

  describe("login", () => {
    it("returns the session user for the correct password", async () => {
      em.findOne.mockResolvedValue(storedUser());

      const result = await service.login("Ada@Example.com", PASSWORD);

      expect(result).toEqual({ id: "u1", email: "ada@example.com", name: "Ada", role: "mentee" });
      expect(em.findOne).toHaveBeenCalledWith(User, { email: "ada@example.com" });
    });

    it("rejects a wrong password with the generic error", async () => {
      em.findOne.mockResolvedValue(storedUser());

      await expect(service.login("ada@example.com", "wrong password")).rejects.toMatchObject({
        code: "unauthorized",
        message: "Invalid email or password",
      });
    });

    it("rejects an unknown e-mail with the same generic error and still compares a hash", async () => {
      em.findOne.mockResolvedValue(null);
      const compare = vi.spyOn(bcrypt, "compare");

      const error = await service.login("nobody@example.com", PASSWORD).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error).toMatchObject({ message: "Invalid email or password" });
      expect(compare).toHaveBeenCalledOnce();
    });

    it("rejects an account without a password the same way", async () => {
      em.findOne.mockResolvedValue(storedUser({ passwordHash: null }));

      await expect(service.login("ada@example.com", PASSWORD)).rejects.toMatchObject({
        message: "Invalid email or password",
      });
    });

    it("computes the dummy hash only once", async () => {
      em.findOne.mockResolvedValue(null);
      const hash = vi.spyOn(bcrypt, "hash");

      await service.login("a@example.com", PASSWORD).catch(() => undefined);
      await service.login("b@example.com", PASSWORD).catch(() => undefined);

      expect(hash).toHaveBeenCalledOnce();
    });

    it("blocks further attempts after 5 failures, even with the right password", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 5; i += 1) {
        await service.login("ada@example.com", "wrong").catch(() => undefined);
      }

      await expect(service.login("ADA@example.com", PASSWORD)).rejects.toBeInstanceOf(TooManyRequestsError);
    });

    it("allows attempts again once the window has passed", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 5; i += 1) {
        await service.login("ada@example.com", "wrong").catch(() => undefined);
      }
      clock.advance(LOGIN_RATE_LIMIT.windowMs + 1);

      await expect(service.login("ada@example.com", PASSWORD)).resolves.toMatchObject({ id: "u1" });
    });

    it("forgets earlier failures after a successful login", async () => {
      em.findOne.mockResolvedValue(storedUser());
      for (let i = 0; i < 4; i += 1) {
        await service.login("ada@example.com", "wrong").catch(() => undefined);
      }
      await service.login("ada@example.com", PASSWORD);

      for (let i = 0; i < 4; i += 1) {
        await service.login("ada@example.com", "wrong").catch(() => undefined);
      }

      await expect(service.login("ada@example.com", PASSWORD)).resolves.toMatchObject({ id: "u1" });
    });
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
  });
});
