import { existsSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("node:fs", () => ({ existsSync: vi.fn() }));

const rootEnvFile = path.resolve(process.cwd(), "../../.env");

async function loadConfig() {
  vi.resetModules();
  return (await import("./config")).ormConfig;
}

describe("ormConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("loads the repo-root .env when it exists", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const loadEnvFile = vi.spyOn(process, "loadEnvFile").mockImplementation(() => undefined);

    await loadConfig();

    expect(existsSync).toHaveBeenCalledWith(rootEnvFile);
    expect(loadEnvFile).toHaveBeenCalledWith(rootEnvFile);
  });

  it("skips loading when there is no .env (e.g. in Docker)", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const loadEnvFile = vi.spyOn(process, "loadEnvFile");

    await loadConfig();

    expect(loadEnvFile).not.toHaveBeenCalled();
  });

  it("uses DATABASE_URL and enables debug only in development", async () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.stubEnv("DATABASE_URL", "postgres://a:b@db:5432/devmentor");
    vi.stubEnv("NODE_ENV", "development");

    const config = await loadConfig();

    expect(config.clientUrl).toBe("postgres://a:b@db:5432/devmentor");
    expect(config.debug).toBe(true);

    vi.stubEnv("NODE_ENV", "production");
    expect((await loadConfig()).debug).toBe(false);
  });
});
