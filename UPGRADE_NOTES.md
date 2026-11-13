# Upgrade notes

Steps needed to move a running DevMentor installation from one release to the next. Each release has its own section, newest first. Changes that need no action are listed only in [CHANGELOG.md](CHANGELOG.md). Rules for what counts as a breaking change are in [BACKWARD_COMPATIBILITY.md](BACKWARD_COMPATIBILITY.md).

## Every upgrade

1. **Back up the database** before deploying: `pg_dump --format=custom "$DATABASE_URL" > devmentor-<old-version>.dump`.
2. **Deploy the new image or tag** and **apply migrations**. With the image, run `devmentor-migrate` as a one-off or set `RUN_MIGRATIONS=true` (README, "Deploying"). From a checkout, run `npm run db:migrate` with `DATABASE_URL` pointing at the target database. Migrations are forward-only in normal operation, and each one ships a `down` method.
3. **Check health**: `GET /api/health` must answer `{"status":"ok","database":"ok"}`.

### Rolling back

1. Redeploy the previous tag (`git checkout v<old-version>` or the previous image).
2. If the new release added migrations, either revert them (`npx mikro-orm migration:down` in `packages/db` of the new release's checkout, once per migration, newest first) or restore the dump from step 1 (`pg_restore --clean --dbname "$DATABASE_URL" devmentor-<old-version>.dump`).
3. Restoring the dump discards data written after the backup. Prefer `migration:down` when the release's section below says its migrations are reversible.

---

## 0.1.0 (2026-11-13)

First release, so there is no earlier version to upgrade from. A fresh installation needs the following.

**Environment** (validated at startup in `packages/core/src/config/env.ts`; the app refuses to start when a variable is missing or invalid):

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL 17 connection URL |
| `AUTH_SECRET` | yes | ≥ 32 characters, `openssl rand -base64 32` |
| `SWEEP_SECRET` | yes | ≥ 32 characters; protects `POST /api/system/sweep` |
| `APP_URL` | yes | Public base URL (Checkout return URLs are built from it) |
| `PAYMENTS_PROVIDER` | yes | `stripe` in production; `fake` is refused when `NODE_ENV=production` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | with `stripe` | Use test-mode keys for demo environments |
| `TRUSTED_PROXY_HOPS` | no (default `1`) | Number of proxies in front of the app (see README, "Deploying behind a reverse proxy") |
| `LOG_LEVEL` | no (default `info`) | |

**Database:** run `npm run db:migrate` once. All 14 migrations of this release are reversible.

**First admin:** `npm run auth:set-password -- --email <you> --admin`, with the password taken from `DEVMENTOR_PASSWORD` (never passed as an argument).

**Scheduler:** call the sweep every few minutes, otherwise unpaid holds never expire and refunds are never reconciled:

```bash
curl -fsS -X POST -H "x-sweep-token: $SWEEP_SECRET" -H "x-devmentor-client: 1" "$APP_URL/api/system/sweep"
```

**Payments webhook:** point the provider at `POST /api/payments/webhook`.
