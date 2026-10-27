import type { EntityManager } from "@mikro-orm/core";
import { Seeder } from "@mikro-orm/seeder";
import type { UserRole } from "../entities/auth/user.constants";
import { User } from "../entities/auth/user.entity";
import { MentorProfile } from "../entities/mentors/mentor-profile.entity";
import type { MentorTag } from "../constants";

interface SeedUser {
  email: string;
  name: string;
  role: UserRole;
  profile?: {
    headline: string;
    bio: string;
    tags: MentorTag[];
    price25: number;
    price50: number;
    shareSlug: string;
    listed: boolean;
  };
}

/**
 * The demo accounts a fresh database gets (`npm run db:seed`). Fixed `.test` addresses, no real personal data.
 * No password is seeded: set one with `npm run auth:set-password -- --email <email>` (the hash lives in core).
 */
export const SEED_USERS: readonly SeedUser[] = [
  { email: "admin@devmentor.test", name: "Demo Admin", role: "admin" },
  {
    email: "mentor@devmentor.test",
    name: "Demo Mentor",
    role: "mentor",
    profile: {
      headline: "Senior TypeScript developer",
      bio: "Demo mentor from the database seeder.",
      tags: ["TypeScript", "React"],
      // Grosze: 100 PLN and 180 PLN.
      price25: 10_000,
      price50: 18_000,
      shareSlug: "demo-mentor",
      listed: true,
    },
  },
  { email: "mentee@devmentor.test", name: "Demo Mentee", role: "mentee" },
];

/**
 * Idempotent: a user whose email already exists is left untouched (never rewritten), so a second run creates nothing.
 * Run by `mikro-orm seeder:run`, which flushes after `run`.
 */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const seed of SEED_USERS) {
      if (await em.findOne(User, { email: seed.email })) continue;
      const user = em.create(User, { email: seed.email, name: seed.name, role: seed.role, passwordHash: null });
      if (seed.profile) em.create(MentorProfile, { user, ...seed.profile });
    }
  }
}
