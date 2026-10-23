const REGISTRY_KEY = Symbol.for("devmentor.db.entitySchemas");

type Registry = Map<string, unknown>;

function registry(): Registry {
  const store = globalThis as typeof globalThis & { [REGISTRY_KEY]?: Registry };
  return (store[REGISTRY_KEY] ??= new Map());
}

/**
 * Creates an entity schema once per process and returns the same instance on every later call.
 * Next.js evaluates this package in several module graphs (RSC, SSR, route handlers); without the
 * `globalThis` cache each graph gets its own schema object and relations fail to resolve.
 */
export function defineSingletonEntity<T>(name: string, factory: () => T): T {
  const schemas = registry();
  if (!schemas.has(name)) schemas.set(name, factory());
  return schemas.get(name) as T;
}
