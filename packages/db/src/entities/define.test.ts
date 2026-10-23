import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineSingletonEntity } from "./define";

const REGISTRY_KEY = Symbol.for("devmentor.db.entitySchemas");

beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[REGISTRY_KEY];
});

describe("defineSingletonEntity", () => {
  it("creates the schema on the first call", () => {
    const schema = { name: "Thing" };
    const factory = vi.fn(() => schema);

    const result = defineSingletonEntity("Thing", factory);

    expect(result).toBe(schema);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("returns the cached instance on the second call without running the factory again", () => {
    const first = defineSingletonEntity("Thing", () => ({ id: 1 }));
    const factory = vi.fn(() => ({ id: 2 }));

    const second = defineSingletonEntity("Thing", factory);

    expect(second).toBe(first);
    expect(factory).not.toHaveBeenCalled();
  });

  it("keeps different names apart", () => {
    const a = defineSingletonEntity("A", () => ({}));
    const b = defineSingletonEntity("B", () => ({}));

    expect(a).not.toBe(b);
  });

  it("returns the same User schema when the entity module is imported in two module registries", async () => {
    const first = (await import("./auth/user.entity")).User;
    vi.resetModules();

    const second = (await import("./auth/user.entity")).User;

    expect(second).toBe(first);
  });
});
