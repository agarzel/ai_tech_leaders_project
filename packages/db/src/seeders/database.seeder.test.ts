import type { EntityManager } from "@mikro-orm/core";
import { describe, expect, it, vi } from "vitest";
import { MENTOR_TAGS } from "../constants";
import { User } from "../entities/auth/user.entity";
import { MentorProfile } from "../entities/mentors/mentor-profile.entity";
import { DatabaseSeeder, SEED_USERS } from "./database.seeder";

// `existing` stands in for the users already in the database; `create` echoes its data back.
function fakeEntityManager(existing: string[] = []) {
  return {
    findOne: vi.fn((_entity: unknown, where: { email: string }) => Promise.resolve(existing.includes(where.email) ? { email: where.email } : null)),
    create: vi.fn((_entity: unknown, data: unknown) => data),
  };
}

const run = (em: ReturnType<typeof fakeEntityManager>) => new DatabaseSeeder().run(em as unknown as EntityManager);

describe("DatabaseSeeder", () => {
  it("creates the admin, the mentor with a profile and the mentee on an empty database, without passwords", async () => {
    const em = fakeEntityManager();

    await run(em);

    const users = em.create.mock.calls.filter(([entity]) => entity === User).map(([, data]) => data);
    expect(users).toEqual([
      { email: "admin@devmentor.test", name: "Demo Admin", role: "admin", passwordHash: null },
      { email: "mentor@devmentor.test", name: "Demo Mentor", role: "mentor", passwordHash: null },
      { email: "mentee@devmentor.test", name: "Demo Mentee", role: "mentee", passwordHash: null },
    ]);
    const profiles = em.create.mock.calls.filter(([entity]) => entity === MentorProfile).map(([, data]) => data);
    expect(profiles).toEqual([expect.objectContaining({ user: users[1], shareSlug: "demo-mentor", listed: true, price25: 10_000, price50: 18_000 })]);
  });

  it("creates nothing when every seed user already exists", async () => {
    const em = fakeEntityManager(SEED_USERS.map((seed) => seed.email));

    await run(em);

    expect(em.findOne).toHaveBeenCalledTimes(SEED_USERS.length);
    expect(em.create).not.toHaveBeenCalled();
  });

  it("creates only the missing users", async () => {
    const em = fakeEntityManager(["mentor@devmentor.test"]);

    await run(em);

    expect(em.create.mock.calls.map(([entity, data]) => [entity, (data as { email?: string }).email])).toEqual([
      [User, "admin@devmentor.test"],
      [User, "mentee@devmentor.test"],
    ]);
  });

  it("uses only known tags, fixed .test addresses and prices within the 10–10,000 PLN bounds", () => {
    for (const seed of SEED_USERS) {
      expect(seed.email).toMatch(/@devmentor\.test$/);
      for (const tag of seed.profile?.tags ?? []) expect(MENTOR_TAGS).toContain(tag);
      for (const price of [seed.profile?.price25, seed.profile?.price50].filter((value) => value !== undefined)) {
        expect(price).toBeGreaterThanOrEqual(1_000);
        expect(price).toBeLessThanOrEqual(1_000_000);
      }
    }
  });
});
