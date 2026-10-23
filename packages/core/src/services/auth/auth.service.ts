import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { UniqueConstraintViolationException, User, type EntityManager, type IUser, type UserRole } from "@devmentor/db";
import type { Clock } from "../../clock";
import type { Env } from "../../config/env";
import { ConflictError, TooManyRequestsError, UnauthorizedError } from "../../http/errors";
import { SESSION_MAX_AGE_SECONDS } from "../../http/session-cookie";
import type { RateLimiter, RateLimiterOptions } from "../../rate-limiter";

const BCRYPT_COST = 12;

/** Login policy: 5 failed attempts per e-mail within 15 minutes. The shared `rateLimiter` is built with it. */
export const LOGIN_RATE_LIMIT: RateLimiterOptions = { maxAttempts: 5, windowMs: 15 * 60_000 };

const INVALID_CREDENTIALS = "Invalid email or password";

/** The authenticated user as routes and guards see it – never contains the password hash. */
export type SessionUserDto = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export class AuthService {
  // Hash compared against when the e-mail is unknown, so the response time does not reveal accounts.
  private dummyHash: Promise<string> | undefined;

  constructor(
    private readonly deps: {
      em: EntityManager;
      clock: Clock;
      rateLimiter: RateLimiter;
      env: Pick<Env, "AUTH_SECRET">;
    },
  ) {}

  async register(email: string, name: string, password: string): Promise<SessionUserDto> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    // Explicit fields only; the role is never taken from the caller (self-registration is always a mentee).
    const user = this.deps.em.create(User, { email: normalizeEmail(email), name, role: "mentee", passwordHash });
    try {
      await this.deps.em.flush();
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictError("A user with this email already exists", {
          email: ["A user with this email already exists"],
        });
      }
      throw error;
    }
    return toSessionUser(user);
  }

  async login(email: string, password: string): Promise<SessionUserDto> {
    const key = normalizeEmail(email);
    if (!this.deps.rateLimiter.check(key).allowed) throw new TooManyRequestsError();

    const user = await this.deps.em.findOne(User, { email: key });
    // Always run one bcrypt comparison, whether or not the account (or its password) exists.
    const matches = await bcrypt.compare(password, user?.passwordHash ?? (await this.getDummyHash()));
    if (!user?.passwordHash || !matches) {
      this.deps.rateLimiter.record(key);
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    this.deps.rateLimiter.reset(key);
    return toSessionUser(user);
  }

  /** Signed session token: HS256, `sub` = user id, `role`, issued-at and 24 h expiry. */
  async issueToken(user: Pick<SessionUserDto, "id" | "role">): Promise<string> {
    const issuedAt = Math.floor(this.deps.clock.now().getTime() / 1000);
    return new SignJWT({ role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + SESSION_MAX_AGE_SECONDS)
      .sign(this.secret());
  }

  /** Returns the user id from a valid token. Fails closed: any problem (signature, expiry, shape) is `UnauthorizedError`. */
  async verifyToken(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, this.secret(), {
        algorithms: ["HS256"],
        currentDate: this.deps.clock.now(),
        requiredClaims: ["sub", "exp"],
      });
      return String(payload.sub);
    } catch {
      throw new UnauthorizedError();
    }
  }

  /** Verifies the token and reloads the user, so a deleted user or a changed role takes effect immediately. */
  async authenticate(token: string): Promise<SessionUserDto> {
    const id = await this.verifyToken(token);
    const user = await this.deps.em.findOne(User, { id });
    if (!user) throw new UnauthorizedError();
    return toSessionUser(user);
  }

  private secret(): Uint8Array {
    return new TextEncoder().encode(this.deps.env.AUTH_SECRET);
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= bcrypt.hash("devmentor-dummy-password", BCRYPT_COST);
    return this.dummyHash;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSessionUser(user: IUser): SessionUserDto {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
