import { createHash, randomBytes } from "node:crypto";
import { MentorInvitation, User, type EntityManager } from "@devmentor/db";
import type { Clock } from "../../clock";
import { NotFoundError, TooManyRequestsError } from "../../http/errors";
import type { RateLimiter, RateLimiterOptions } from "../../rate-limiter";

/** How long an invitation link works (spec: mentor-accounts-and-offer, MentorInvitation.expiresAt). */
export const INVITATION_TTL_MS = 14 * 24 * 60 * 60_000;

/** Public invitation routes, keyed by client IP: 20 previews per 15 minutes; 10 failed registrations per hour. */
export const INVITATION_RATE_LIMITS = {
  preview: { maxAttempts: 20, windowMs: 15 * 60_000 } satisfies RateLimiterOptions,
  registration: { maxAttempts: 10, windowMs: 60 * 60_000 } satisfies RateLimiterOptions,
};

const INVALID_INVITATION = "This invitation is no longer valid";

/** A created invitation. `token` is the raw link secret – returned this once and never stored. */
export type CreatedInvitationDto = {
  id: string;
  email: string;
  expiresAt: string;
  token: string;
};

/** What a valid token reveals: nothing beyond the address being registered. */
export type InvitationPreviewDto = { email: string; expiresAt: string };

export type InvitationStatus = "pending" | "used" | "revoked" | "expired";

/** One row of the admin list. Never carries the token or its hash. */
export type InvitationListItemDto = {
  id: string;
  email: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
  /** The issuing admin's name (or e-mail when the name is empty); null when that admin was deleted. */
  createdBy: string | null;
};

export class InvitationService {
  constructor(
    private readonly deps: {
      em: EntityManager;
      clock: Clock;
      /** Process-wide limiters (see container.ts), separate from the login limiter. */
      invitationPreviewLimiter: RateLimiter;
      invitationRegistrationLimiter: RateLimiter;
    },
  ) {}

  /** Counts one preview request for the IP; refuses (`TooManyRequestsError`) once the IP is over its limit. */
  guardPreview(ip: string): void {
    const limiter = this.deps.invitationPreviewLimiter;
    if (!limiter.check(ip).allowed) throw new TooManyRequestsError();
    limiter.record(ip);
  }

  /** Refuses an IP over its failed-registration limit; runs `work`; counts it only when `work` throws. */
  async guardRegistration<T>(ip: string, work: () => Promise<T>): Promise<T> {
    const limiter = this.deps.invitationRegistrationLimiter;
    if (!limiter.check(ip).allowed) throw new TooManyRequestsError();
    try {
      return await work();
    } catch (error) {
      limiter.record(ip);
      throw error;
    }
  }

  /** All invitations, newest first. Status is computed: used wins over everything, then revoked, then expired. */
  async listForAdmin(): Promise<InvitationListItemDto[]> {
    const now = this.deps.clock.now();
    const invitations = await this.deps.em.find(
      MentorInvitation,
      {},
      { populate: ["createdBy"], orderBy: { createdAt: "desc" } },
    );
    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      status: statusOf(invitation, now),
      createdAt: invitation.createdAt.toISOString(),
      expiresAt: invitation.expiresAt.toISOString(),
      createdBy: invitation.createdBy ? invitation.createdBy.name || invitation.createdBy.email : null,
    }));
  }

  /** Issues a link token for the e-mail and revokes the older open invitations for it, in one transaction. */
  async create(adminId: string, email: string): Promise<CreatedInvitationDto> {
    const now = this.deps.clock.now();
    const normalized = normalizeEmail(email);
    const token = randomBytes(32).toString("base64url");

    const invitation = await this.deps.em.transactional(async (em) => {
      await em.nativeUpdate(MentorInvitation, { email: normalized, usedAt: null, revokedAt: null }, { revokedAt: now });
      const created = em.create(MentorInvitation, {
        email: normalized,
        tokenHash: hashToken(token),
        expiresAt: new Date(now.getTime() + INVITATION_TTL_MS),
        createdBy: em.getReference(User, adminId),
      });
      await em.flush();
      return created;
    });

    return { id: invitation.id, email: invitation.email, expiresAt: invitation.expiresAt.toISOString(), token };
  }

  /** Looks up an open invitation. Unknown, used, revoked and expired tokens all fail the same way (`NotFoundError`). */
  async verify(token: string): Promise<InvitationPreviewDto> {
    const invitation = await this.deps.em.findOne(MentorInvitation, { tokenHash: hashToken(token) });
    if (!invitation || !isOpen(invitation, this.deps.clock.now())) throw new NotFoundError(INVALID_INVITATION);
    return { email: invitation.email, expiresAt: invitation.expiresAt.toISOString() };
  }

  /**
   * Marks the invitation used and runs `createAccount` in the same transaction, so a failed account creation
   * leaves the invitation open and two parallel uses of one token cannot both succeed. `createAccount` must write
   * through the `em` it receives and return the new user's id; the invitation's e-mail is the account's e-mail.
   */
  async consume<T extends { id: string }>(
    token: string,
    createAccount: (em: EntityManager, email: string) => Promise<T>,
  ): Promise<T> {
    const now = this.deps.clock.now();
    const tokenHash = hashToken(token);

    return this.deps.em.transactional(async (em) => {
      // Conditional update: only one of two parallel callers sees an affected row.
      const claimed = await em.nativeUpdate(
        MentorInvitation,
        { tokenHash, usedAt: null, revokedAt: null, expiresAt: { $gt: now } },
        { usedAt: now },
      );
      if (claimed !== 1) throw new NotFoundError(INVALID_INVITATION);

      const invitation = await em.findOneOrFail(MentorInvitation, { tokenHash });
      const account = await createAccount(em, invitation.email);
      await em.nativeUpdate(MentorInvitation, { id: invitation.id }, { usedBy: em.getReference(User, account.id) });
      return account;
    });
  }
}

function statusOf(
  invitation: { usedAt?: Date | null; revokedAt?: Date | null; expiresAt: Date },
  now: Date,
): InvitationStatus {
  if (invitation.usedAt) return "used";
  if (invitation.revokedAt) return "revoked";
  return invitation.expiresAt.getTime() > now.getTime() ? "pending" : "expired";
}

function isOpen(invitation: { usedAt?: Date | null; revokedAt?: Date | null; expiresAt: Date }, now: Date): boolean {
  return !invitation.usedAt && !invitation.revokedAt && invitation.expiresAt.getTime() > now.getTime();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
