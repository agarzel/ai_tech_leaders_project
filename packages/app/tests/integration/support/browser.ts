import { execFile } from "node:child_process";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { ARTIFACTS_DIR, REPO_ROOT } from "./process";

const execFileAsync = promisify(execFile);

const AGENT_BROWSER = path.join(REPO_ROOT, "node_modules/.bin/agent-browser");
const COMMAND_TIMEOUT_MS = 45_000;

/**
 * Thin wrapper over the agent-browser CLI, one isolated session per test file.
 * agent-browser keeps cookies under the session name, so every instance gets a fresh name: a session left
 * behind by an interrupted run would otherwise carry a sign-in for a database that no longer exists.
 */
export class Browser {
  private readonly session: string;

  constructor(
    session: string,
    private readonly baseUrl: string,
  ) {
    this.session = `${session}-${randomUUID().slice(0, 8)}`;
  }

  /** Runs an agent-browser command; rejects with the CLI's message if it fails (e.g. element not found). */
  async run(...args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync(AGENT_BROWSER, ["--session", this.session, ...args], {
        timeout: COMMAND_TIMEOUT_MS,
      });
      return stdout.trim();
    } catch (error) {
      const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
      throw new Error(`agent-browser ${args.join(" ")} failed:\n${stdout}${stderr}`.trim());
    }
  }

  open(pathname: string) {
    return this.run("open", new URL(pathname, this.baseUrl).toString());
  }

  title() {
    return this.run("get", "title");
  }

  url() {
    return this.run("get", "url");
  }

  /** Waits until the text is visible on the page (substring match). */
  waitForText(text: string) {
    return this.run("wait", "--text", text);
  }

  /** Text of the element with this ARIA role and accessible name; fails if there is none. */
  textOf(role: string, name: string) {
    return this.run("find", "role", role, "text", "--name", name);
  }

  click(role: string, name: string) {
    return this.run("find", "role", role, "click", "--name", name, "--exact");
  }

  fill(label: string, value: string) {
    return this.run("find", "label", label, "fill", value, "--exact");
  }

  select(fieldName: string, value: string) {
    return this.run("select", `select[name="${fieldName}"]`, value);
  }

  screenshot(name: string) {
    return this.run("screenshot", "--full", path.join(ARTIFACTS_DIR, `${name}.png`));
  }

  close() {
    return this.run("close");
  }
}
