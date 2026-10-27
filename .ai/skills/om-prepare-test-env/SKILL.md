---
name: om-prepare-test-env
description: DevMentor override for om-prepare-test-env – discovered run recipe, credentials and the open verification step. Read before running the installed skill in this repo.
---

# om-prepare-test-env – DevMentor notes

Applies on top of the installed skill; its safety rules still win.

## Entrypoint

- Up: `sh .ai/scripts/test-env-up.sh` (`--force`, `--force-rebuild`). Down: `sh .ai/scripts/test-env-down.sh`.
- Mode `ephemeral`: a throwaway `postgres:17-alpine` container on `127.0.0.1` (preferred port 55432), named `devmentor-test-env-<checksum of the checkout path>` so worktrees never share a database.
- Chain on a fresh boot: `npm ci` (only when the package manifests changed – build cache) → `npm run db:migrate` → `npm run db:seed` → `npm run auth:set-password` for the three seeded accounts → `npm run dev -w @devmentor/app -- --hostname 127.0.0.1 --port <port>` (preferred 3200; 3000 is `npm run dev`, 3100 the integration tests) with `NEXT_DIST_DIR=.next-test-env`.
- App env is exported by the script and wins over the root `.env` (`process.loadEnvFile` never overrides): `PAYMENTS_PROVIDER=fake`, random `AUTH_SECRET` and `SWEEP_SECRET` per environment, `APP_URL` = base URL.
- Readiness: `GET /api/health` answers `"database":"ok"`; the reuse check also signs in as the admin through `POST /api/auth/login`. Every POST needs the CSRF header `x-devmentor-client: 1`, or the API answers 403 – a probe without it made every warm run reboot (repaired 2026-10-27).
- A VS Code terminal attaches a debugger to every node process ("Debugger attached"); the script unsets `VSCODE_INSPECTOR_OPTIONS` to keep the boot fast.
- Accounts: `admin@`, `mentor@` and `mentee@devmentor.test` (from `db:seed`); passwords are generated per environment into `.ai/qa/test-env.env` (gitignored) as `TEST_ADMIN_PASSWORD`, `TEST_MENTOR_PASSWORD`, `TEST_MENTEE_PASSWORD`, plus `SWEEP_SECRET` for `POST /api/system/sweep`.
- Browser: `node_modules/.bin/agent-browser` (repo dependency); the script records `doctor`'s result and never reinstalls.

## Verification

Generated on 2026-10-27 in the agent sandbox, which cannot reach the Docker socket, write `~/.agent-browser` or connect to `127.0.0.1`, so the agent cannot run the scripts there. Verified on the owner's macOS the same day: cold 36s, warm 0.6s (`TEST_ENV_REUSED=1`); the build-cache fingerprint changes when a package manifest changes. Run the scripts with `sh` from a terminal, and do not paste trailing `# comments` into zsh: without `interactivecomments` they arrive as arguments.
