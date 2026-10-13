import { MikroORM } from "@mikro-orm/postgresql";
import { describe, expect, it, vi } from "vitest";
import { ormConfig } from "./config";
import { getOrm } from "./orm";

vi.mock("@mikro-orm/postgresql", async (importOriginal) => {
  const original = await importOriginal<typeof import("@mikro-orm/postgresql")>();
  return { ...original, MikroORM: { init: vi.fn(async () => ({ fake: "orm" })) } };
});

describe("getOrm", () => {
  it("initialises MikroORM once with the app config and reuses it", async () => {
    const first = await getOrm();
    const second = await getOrm();

    expect(first).toBe(second);
    expect(MikroORM.init).toHaveBeenCalledTimes(1);
    expect(MikroORM.init).toHaveBeenCalledWith(ormConfig);
  });
});
