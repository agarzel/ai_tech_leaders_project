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
- Readiness: `GET /api/health` answers `"database":"ok"`; the reuse check also signs in as the admin through `POST /api/auth/login`.
- Accounts: `admin@`, `mentor@` and `mentee@devmentor.test` (from `db:seed`); passwords are generated per environment into `.ai/qa/test-env.env` (gitignored) as `TEST_ADMIN_PASSWORD`, `TEST_MENTOR_PASSWORD`, `TEST_MENTEE_PASSWORD`, plus `SWEEP_SECRET` for `POST /api/system/sweep`.
- Browser: `node_modules/.bin/agent-browser` (repo dependency); the script records `doctor`'s result and never reinstalls.

## Open: cold and warm verification

Generated on 2026-10-27 inside the agent sandbox, which cannot reach the Docker socket, write `~/.agent-browser` or bind the app's port, so neither run was possible there. Checked there: `sh -n` on both scripts, `json_get` against a sample descriptor, and the build-cache fingerprint (stable, and it changes when a manifest changes).

To finish generation, run in a terminal with Docker Desktop running:

```sh
time sh .ai/scripts/test-env-up.sh   # cold: npm ci (first time), database, migrate, seed, app
time sh .ai/scripts/test-env-up.sh   # warm: must print TEST_ENV_REUSED=1 within seconds
sh .ai/scripts/test-env-down.sh
```

Then record both timings in the `# history:` header of `test-env-up.sh` and delete this section. When a run fails, repair the script (not the symptom) and add a history line.
