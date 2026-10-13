import { spawn } from "node:child_process";
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "../../../../..");

/** Screenshots and the app server log – uploaded by CI. */
export const ARTIFACTS_DIR = path.resolve(import.meta.dirname, "../.artifacts");

/** Runs a command from the repo root and rejects with its output if it fails. */
export function run(command: string, args: string[], env: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: REPO_ROOT, env: { ...process.env, ...env } });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} ${args.join(" ")} exited with ${code}:\n${output}`));
    });
  });
}
