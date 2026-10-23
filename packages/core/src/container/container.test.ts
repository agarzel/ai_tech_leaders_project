import { describe, expect, it, vi } from "vitest";
import { getOrm } from "@devmentor/db";
import { getEnv } from "../config/env";
import { UserService } from "../services/auth/user.service";
import { InvitationService } from "../services/mentors/invitation.service";
import { MentorService } from "../services/mentors/mentor.service";
import { HealthService } from "../services/system/health.service";
import { createRequestScope, getContainer } from "./container";

vi.mock("@devmentor/db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@devmentor/db")>()),
  getOrm: vi.fn(),
}));
vi.mock("../config/env", () => ({ getEnv: vi.fn() }));

const forks: object[] = [];
const orm = {
  em: {
    fork: vi.fn(() => {
      const fork = { id: forks.length };
      forks.push(fork);
      return fork;
    }),
  },
};
vi.mocked(getOrm).mockResolvedValue(orm as never);

describe("container", () => {
  it("creates the container once, validating the environment first", async () => {
    const [first, second] = await Promise.all([getContainer(), getContainer()]);

    expect(first).toBe(second);
    expect(getEnv).toHaveBeenCalledTimes(1);
    expect(getOrm).toHaveBeenCalledTimes(1);
    expect(first.cradle.orm).toBe(orm);
  });

  it("gives every request scope its own EntityManager fork and scoped services", async () => {
    const scopeA = await createRequestScope();
    const scopeB = await createRequestScope();

    expect(scopeA.cradle.em).not.toBe(scopeB.cradle.em);
    expect(forks).toEqual([scopeA.cradle.em, scopeB.cradle.em]);
    expect(scopeA.cradle.userService).toBeInstanceOf(UserService);
    expect(scopeA.cradle.healthService).toBeInstanceOf(HealthService);
    expect(scopeA.cradle.invitationService).toBeInstanceOf(InvitationService);
    expect(scopeA.cradle.mentorService).toBeInstanceOf(MentorService);
    // Scoped: one instance per scope. Compared by reference – services hold Awilix proxies that break pretty-printing.
    expect(scopeA.cradle.userService === scopeA.cradle.userService).toBe(true);
    expect(scopeA.cradle.userService === scopeB.cradle.userService).toBe(false);
    expect(scopeA.cradle.logger).toBeDefined();
  });
});
