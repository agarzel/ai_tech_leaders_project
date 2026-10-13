import { asClass, asValue, createContainer, InjectionMode, type AwilixContainer } from "awilix";
import { getOrm } from "@devmentor/db";
import { getEnv } from "../config/env";
import { logger } from "../logger";
import { UserService } from "../services/auth/user.service";
import { HealthService } from "../services/system/health.service";
import type { Cradle } from "./cradle";

export type AppContainer = AwilixContainer<Cradle>;

const globalForContainer = globalThis as unknown as { container?: Promise<AppContainer> };

// Every dependency is registered here by hand – no auto-discovery, so each binding is greppable.
async function createAppContainer(): Promise<AppContainer> {
  getEnv(); // fail fast on missing/invalid environment variables

  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    orm: asValue(await getOrm()),
    logger: asValue(logger),
    healthService: asClass(HealthService).scoped(),
    userService: asClass(UserService).scoped(),
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
