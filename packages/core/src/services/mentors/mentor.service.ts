import { randomInt } from "node:crypto";
import { CURRENCY, MentorProfile, SESSION_LENGTHS, Slot, UniqueConstraintViolationException, User, type EntityManager, type IMentorProfile, type SessionLength } from "@devmentor/db";
import type { Clock } from "../../clock";
import type { Page } from "../../http/crud";
import { ConflictError, NotFoundError, ValidationError } from "../../http/errors";
import type { MentorProfileInput } from "../../validators/mentors/mentor-profile.schema";
import type { PublicMentorQuery } from "../../validators/mentors/public-mentor-query.schema";
import { bookableWindow, toSlotDto, type SlotDto } from "../availability/slot.service";

/** How many times a colliding share slug is regenerated before giving up. */
export const SLUG_MAX_ATTEMPTS = 5;

const SLUG_SUFFIX_LENGTH = 6;
const SLUG_BASE_MAX_LENGTH = 40;
const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

/** The mentor's own profile as the API returns it (the name lives on the user). */
export type MentorProfileDto = {
  id: string;
  name: string;
  headline: string | null;
  bio: string | null;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  currency: typeof CURRENCY;
  shareSlug: string;
  listed: boolean;
};

/**
 * A mentor as the public sees them. No e-mail, user id, role or profile id (spec: Sensitive data), and no
 * ratings or reviews (N02).
 */
export type PublicMentorDto = {
  name: string;
  headline: string | null;
  bio: string | null;
  tags: string[];
  links: string[];
  price25: number | null;
  price50: number | null;
  currency: typeof CURRENCY;
  shareSlug: string;
  soonestBookableSlotAt: string | null;
};

/** The share page: the public mentor plus every bookable slot, so the page needs one request. */
export type PublicMentorDetailDto = PublicMentorDto & { slots: SlotDto[] };

export class MentorService {
  constructor(private readonly deps: { em: EntityManager; clock: Clock }) {}

  /** The caller's profile, created on the first call. Identified by the session user, never by a client id. */
  async getOrCreateOwn(userId: string): Promise<MentorProfileDto> {
    const existing = await this.findProfile(userId);
    if (existing) return toDto(existing);

    const user = await this.deps.em.findOne(User, { id: userId });
    if (!user) throw new NotFoundError("User not found");

    for (let attempt = 0; attempt < SLUG_MAX_ATTEMPTS; attempt++) {
      // A fork per attempt: a failed flush leaves its pending entity behind in the failing EntityManager.
      const em = this.deps.em.fork();
      const profile = em.create(MentorProfile, { user: em.getReference(User, userId), shareSlug: generateSlug(user.name) });
      try {
        await em.flush();
        return toDto(profile, user.name);
      } catch (error) {
        if (!(error instanceof UniqueConstraintViolationException)) throw error;
        // Either the slug is taken (try another) or a parallel first visit created the profile (use it).
        const created = await this.findProfile(userId);
        if (created) return toDto(created);
      }
    }
    throw new ConflictError("Could not create the profile, try again");
  }

  /**
   * Saves the caller's own profile, name and list opt-in. Prices are grosze, null while not set. Listing
   * needs both prices (the name and headline a save requires are already there); fails closed otherwise.
   */
  async updateOwn(userId: string, input: MentorProfileInput): Promise<MentorProfileDto> {
    if (input.listed && (input.price25 === null || input.price50 === null)) {
      throw new ValidationError("Check the highlighted fields.", { listed: ["Set both prices before joining the public list."] });
    }
    await this.getOrCreateOwn(userId);
    const profile = await this.findProfile(userId);
    if (!profile) throw new NotFoundError("Profile not found");

    profile.user.name = input.name;
    profile.headline = input.headline;
    profile.bio = input.bio;
    profile.tags = input.tags;
    profile.links = input.links;
    profile.price25 = input.price25;
    profile.price50 = input.price50;
    profile.listed = input.listed;
    await this.deps.em.flush();
    return toDto(profile);
  }

  /**
   * The public list: mentors that opted in (`listed`), have both prices and at least one bookable slot, soonest
   * bookable slot first. A mentor without a bookable slot never appears, so the list is built from the slots.
   */
  async listPublic(query: PublicMentorQuery): Promise<Page<PublicMentorDto>> {
    const now = this.deps.clock.now();
    const slots = await this.deps.em.find(
      Slot,
      {
        status: "open",
        startsAt: bookableWindow(now),
        mentor: { listed: true, price25: { $ne: null }, price50: { $ne: null } },
      },
      { orderBy: { startsAt: "asc" }, populate: ["mentor.user"] },
    );

    // Slots arrive soonest first, so the first slot seen per mentor is that mentor's soonest one.
    const soonest = new Map<string, { profile: IMentorProfile; startsAt: Date }>();
    for (const slot of slots) {
      const profile = slot.mentor as unknown as IMentorProfile;
      if (!soonest.has(profile.id)) soonest.set(profile.id, { profile, startsAt: slot.startsAt });
    }
    const matching = [...soonest.values()].filter(({ profile }) => !query.tag || (profile.tags ?? []).includes(query.tag));

    const start = (query.page - 1) * query.pageSize;
    return {
      page: query.page,
      pageSize: query.pageSize,
      total: matching.length,
      items: matching.slice(start, start + query.pageSize).map(({ profile, startsAt }) => toPublicDto(profile, startsAt)),
    };
  }

  /**
   * The share page of one mentor, found by slug. Works for an unlisted mentor too: `listed` only controls the
   * public list, the link is the other way in (spec: API Contracts `GET /api/mentors/[slug]`, R08, D03). Without
   * both prices nothing can be booked, so the slots are empty. An unknown slug is `NotFoundError`.
   */
  async getPublicBySlug(slug: string): Promise<PublicMentorDetailDto> {
    const profile = await this.deps.em.findOne(MentorProfile, { shareSlug: slug }, { populate: ["user"] });
    if (!profile) throw new NotFoundError("Mentor not found");

    const now = this.deps.clock.now();
    const priced = profile.price25 != null && profile.price50 != null;
    const slots = priced
      ? await this.deps.em.find(Slot, { mentor: profile.id, status: "open", startsAt: bookableWindow(now) }, { orderBy: { startsAt: "asc" } })
      : [];
    return { ...toPublicDto(profile, slots[0]?.startsAt), slots: slots.map((slot) => toSlotDto(slot, now)) };
  }

  /**
   * The price in grosze of one session length on a profile, read at booking time. Fails closed: an unsupported
   * length, an unknown profile or a price that is not set is an error, never a default or zero.
   */
  async priceFor(mentorProfileId: string, lengthMinutes: number): Promise<number> {
    if (!SESSION_LENGTHS.includes(lengthMinutes as SessionLength)) {
      throw new ValidationError("Pick a session length", { lengthMinutes: ["Pick a session length"] });
    }
    const profile = await this.deps.em.findOne(MentorProfile, { id: mentorProfileId });
    if (!profile) throw new NotFoundError("Mentor not found");
    const price = lengthMinutes === 25 ? profile.price25 : profile.price50;
    if (price == null) throw new ConflictError("This mentor has not set a price for this session length");
    return price;
  }

  private findProfile(userId: string): Promise<IMentorProfile | null> {
    return this.deps.em.findOne(MentorProfile, { user: userId }, { populate: ["user"] });
  }
}

function toDto(profile: IMentorProfile, userName?: string): MentorProfileDto {
  return {
    id: profile.id,
    name: userName ?? profile.user.name,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    tags: profile.tags ?? [],
    links: profile.links ?? [],
    price25: profile.price25 ?? null,
    price50: profile.price50 ?? null,
    currency: CURRENCY,
    shareSlug: profile.shareSlug,
    listed: profile.listed ?? false,
  };
}

function toPublicDto(profile: IMentorProfile, soonestBookableSlotAt?: Date): PublicMentorDto {
  return {
    name: profile.user.name,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    tags: profile.tags ?? [],
    links: profile.links ?? [],
    price25: profile.price25 ?? null,
    price50: profile.price50 ?? null,
    currency: CURRENCY,
    shareSlug: profile.shareSlug,
    soonestBookableSlotAt: soonestBookableSlotAt?.toISOString() ?? null,
  };
}

/** URL-safe slug of the name (ASCII, hyphens) plus 6 random characters, e.g. "ada-lovelace-k3x9qz". */
function generateSlug(name: string): string {
  const base =
    name
      .toLowerCase()
      .replaceAll("ł", "l")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, SLUG_BASE_MAX_LENGTH)
      .replace(/-+$/, "") || "mentor";
  let suffix = "";
  for (let i = 0; i < SLUG_SUFFIX_LENGTH; i++) suffix += SLUG_ALPHABET[randomInt(SLUG_ALPHABET.length)];
  return `${base}-${suffix}`;
}
