import { asClass, asValue, createContainer, InjectionMode, type AwilixContainer } from "awilix";
import { getOrm } from "@devmentor/db";
import { realClock } from "../clock";
import { getEnv } from "../config/env";
import { logger } from "../logger";
import { RateLimiter } from "../rate-limiter";
import { AuthService, LOGIN_RATE_LIMIT } from "../services/auth/auth.service";
import { UserService } from "../services/auth/user.service";
import { SlotService } from "../services/availability/slot.service";
import { INVITATION_RATE_LIMITS, InvitationService } from "../services/mentors/invitation.service";
import { MentorService } from "../services/mentors/mentor.service";
import { HealthService } from "../services/system/health.service";
import type { Cradle } from "./cradle";

export type AppContainer = AwilixContainer<Cradle>;

const globalForContainer = globalThis as unknown as { container?: Promise<AppContainer> };

// Every dependency is registered here by hand – no auto-discovery, so each binding is greppable.
async function createAppContainer(): Promise<AppContainer> {
  const env = getEnv(); // fail fast on missing/invalid environment variables

  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    orm: asValue(await getOrm()),
    logger: asValue(logger),
    env: asValue(env),
    clock: asValue(realClock),
    // One process-wide instance: the limiter's counters must outlive a single request.
    rateLimiter: asValue(new RateLimiter({ clock: realClock }, LOGIN_RATE_LIMIT)),
    invitationPreviewLimiter: asValue(new RateLimiter({ clock: realClock }, INVITATION_RATE_LIMITS.preview)),
    invitationRegistrationLimiter: asValue(new RateLimiter({ clock: realClock }, INVITATION_RATE_LIMITS.registration)),
    healthService: asClass(HealthService).scoped(),
    userService: asClass(UserService).scoped(),
    authService: asClass(AuthService).scoped(),
    invitationService: asClass(InvitationService).scoped(),
    mentorService: asClass(MentorService).scoped(),
    slotService: asClass(SlotService).scoped(),
  });

  return container;
}

export function getContainer(): Promise<AppContainer> {
  globalForContainer.container ??= createAppContainer();
  return globalForContainer.container;
}

/**
 * Request scope: a fresh EntityManager fork, so identity maps are never shared between requests.
 * Resolve services from the returned scope inside route handlers and server components.
 */
export async function createRequestScope(): Promise<AppContainer> {
  const scope = (await getContainer()).createScope();
  scope.register({ em: asValue(scope.cradle.orm.em.fork()) });
  return scope;
}
