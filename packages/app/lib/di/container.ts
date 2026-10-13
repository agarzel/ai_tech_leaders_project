import {
  asClass,
  asValue,
  createContainer,
  InjectionMode,
  type AwilixContainer,
} from "awilix";
import type { EntityManager, MikroORM } from "@mikro-orm/postgresql";
import { getOrm } from "@/lib/db/orm";
import { HealthService } from "@/lib/services/health.service";

export type Cradle = {
  orm: MikroORM;
  em: EntityManager;
  healthService: HealthService;
};

export type AppContainer = AwilixContainer<Cradle>;

const globalForContainer = globalThis as unknown as { container?: Promise<AppContainer> };

async function createAppContainer(): Promise<AppContainer> {
  const container = createContainer<Cradle>({
    injectionMode: InjectionMode.PROXY,
    strict: true,
  });

  container.register({
    orm: asValue(await getOrm()),
    healthService: asClass(HealthService).scoped(),
  });

  return container;
}

export function getContainer(): Promise<AppContainer> {
  globalForContainer.container ??= createAppContainer();
  return globalForContainer.container;
}

/**
 * Request scope: a fresh EntityManager fork, so identity maps are never shared between requests.
 * Resolve services from the returned scope inside route handlers and server actions.
 */
export async function createRequestScope(): Promise<AppContainer> {
  const scope = (await getContainer()).createScope();
  scope.register({ em: asValue(scope.cradle.orm.em.fork()) });
  return scope;
}
