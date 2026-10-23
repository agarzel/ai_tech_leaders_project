import { randomInt } from "node:crypto";
import { CURRENCY, MentorProfile, UniqueConstraintViolationException, User, type EntityManager, type IMentorProfile } from "@devmentor/db";
import { ConflictError, NotFoundError } from "../../http/errors";
import type { MentorProfileInput } from "../../validators/mentors/mentor-profile.schema";

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

export class MentorService {
  constructor(private readonly deps: { em: EntityManager }) {}

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

  /** Saves the caller's own profile and name. Prices are grosze, null while not set. */
  async updateOwn(userId: string, input: MentorProfileInput): Promise<MentorProfileDto> {
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
    await this.deps.em.flush();
    return toDto(profile);
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
