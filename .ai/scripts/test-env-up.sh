#!/bin/sh
# om-prepare-test-env: generated entrypoint (contract v2)
# regenerate with: om-prepare-test-env --regenerate
# history:
#   2026-10-27 generated in the agent sandbox (no Docker access there); cold/warm verification pending on the owner's machine
set -eu

# --- project-specific facts (discovered from docker-compose.yml, .env.example, package.json, CI, the integration setup) ---
DB_IMAGE="postgres:17-alpine"                 # pinned in docker-compose.yml
DB_USER="devmentor"; DB_PASSWORD="devmentor"; DB_NAME="devmentor"   # disposable demo values (as in .env.example)
DB_PREFERRED_PORT=55432
APP_PREFERRED_PORT=3200                       # 3000 = npm run dev, 3100 = integration tests
APP_DIST_DIR=".next-test-env"                 # own Next.js build dir (next.config.ts reads NEXT_DIST_DIR)
HEALTH_PATH="/api/health"                     # {"status":"ok","database":"ok"} when the database is reachable
WARM_UP_PATHS="/ /login /mentors /m/demo-mentor /admin"   # first hits compile in dev mode
PREP_CHAIN="npm ci"                           # what CI runs; dev mode needs no build
BUILD_INPUTS="package.json package-lock.json packages/app/package.json packages/core/package.json packages/db/package.json packages/ui/package.json"
BUILD_ENV_VARS=""
ARTIFACTS="node_modules"
# Changes the dev server cannot hot-reload: a newer file here makes a running environment stale.
FRESHNESS_PATHS="$BUILD_INPUTS packages/db/src/migrations packages/db/src/seeders packages/app/next.config.ts"
# Seeded by `npm run db:seed`; passwords are generated per environment into the gitignored credentials file.
SEED_ACCOUNTS="admin:admin@devmentor.test mentor:mentor@devmentor.test mentee:mentee@devmentor.test"
TTL="${TEST_ENV_CACHE_TTL_SECONDS:-600}"

FORCE=0; FORCE_REBUILD=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --force-rebuild) FORCE_REBUILD=1 ;;
    *) echo "Unknown flag: $arg (use --force, --force-rebuild)" >&2; exit 2 ;;
  esac
done

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"
QA_DIR=".ai/qa"
DESCRIPTOR="$QA_DIR/test-env.json"
CREDENTIALS_FILE="$QA_DIR/test-env.env"
BUILD_CACHE="$QA_DIR/test-env-build-cache.json"
APP_LOG="$QA_DIR/test-env-app.log"
LOCK_DIR="$QA_DIR/test-env.lock"
# Scoped per checkout, so worktrees never share or remove each other's database.
CONTAINER="devmentor-test-env-$(printf '%s' "$ROOT" | cksum | awk '{print $1}')"
mkdir -p "$QA_DIR"

now() { date -u +%FT%TZ; }
log() { printf '[test-env] %s\n' "$*" >&2; }
json_get() { sed -n "s/.*\"$1\": *\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" "$2" 2>/dev/null | head -n 1 | sed 's/[[:space:]]*$//'; }

free_port() {
  if command -v python3 >/dev/null 2>&1; then
    python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1]);s.close()'
  elif command -v node >/dev/null 2>&1; then
    node -e 's=require("net").createServer();s.listen(0,"127.0.0.1",()=>{console.log(s.address().port);s.close()})'
  else
    awk 'BEGIN{srand();print 20000+int(rand()*20000)}'
  fi
}
port_free() { ! (command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 "$1" >/dev/null 2>&1); }
pick_port() { if port_free "$1"; then echo "$1"; else free_port; fi; }
random_secret() { openssl rand -base64 36 2>/dev/null | tr -d '\n/+=' || node -e 'console.log(require("crypto").randomBytes(36).toString("base64url"))'; }

# --- lock: one bootstrap at a time ---
take_lock() {
  waited=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    owner=$(json_get pid "$LOCK_DIR/owner.json")
    if [ -n "$owner" ] && ! kill -0 "$owner" 2>/dev/null; then
      log "removing a stale lock (pid $owner is gone)"; rm -rf "$LOCK_DIR"; continue
    fi
    [ "$waited" -ge 300 ] && { log "another bootstrap holds $LOCK_DIR for 5 min"; exit 1; }
    sleep 2; waited=$((waited + 2))
  done
  printf '{ "pid": %s, "source": "test-env-up.sh", "acquiredAt": "%s" }\n' "$$" "$(now)" > "$LOCK_DIR/owner.json"
}
take_lock
trap 'rm -rf "$LOCK_DIR"' EXIT INT TERM

# --- browser provider: recorded, never reinstalled here (provisioned at generation time) ---
BROWSER_BIN="node_modules/.bin/agent-browser"
browser_state() {
  BROWSER_INSTALLED=0; BROWSER_VERSION=unknown; BROWSER_NOTES="agent-browser not found in node_modules; run npm ci"
  [ -x "$BROWSER_BIN" ] || return 0
  BROWSER_VERSION=$("$BROWSER_BIN" --version 2>/dev/null | awk '{print $2}')
  if "$BROWSER_BIN" doctor --json >/dev/null 2>&1; then BROWSER_INSTALLED=1; BROWSER_NOTES=""
  else BROWSER_NOTES="agent-browser doctor failed; run '$BROWSER_BIN doctor' for details"; fi
}

print_result() {
  printf 'TEST_ENV_STATUS=running\nTEST_ENV_BASE_URL=%s\nTEST_ENV_DESCRIPTOR=%s\nTEST_ENV_REUSED=%s\nBROWSER_PROVIDER=agent-browser\nBROWSER_INSTALLED=%s\n' \
    "$1" "$DESCRIPTOR" "$2" "$3"
}

# --- reuse check: attach, don't reboot ---
newer_than_start() {
  for p in $FRESHNESS_PATHS; do
    [ -e "$p" ] || continue
    [ -n "$(find "$p" -newer "$DESCRIPTOR" -type f ! -path '*/node_modules/*' 2>/dev/null | head -n 1)" ] && return 0
  done
  return 1
}
reusable() {
  [ -f "$DESCRIPTOR" ] || return 1
  [ "$(json_get status "$DESCRIPTOR")" = running ] || return 1
  pid=$(json_get pid "$DESCRIPTOR"); base=$(json_get baseUrl "$DESCRIPTOR"); started=$(json_get startedAtEpoch "$DESCRIPTOR")
  [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null || { log "recorded app pid is gone"; return 1; }
  curl -fsS -m 10 "$base/" >/dev/null 2>&1 || { log "app shell probe failed"; return 1; }
  curl -fsS -m 10 "$base$HEALTH_PATH" 2>/dev/null | grep -q '"database":"ok"' || { log "health probe failed (database)"; return 1; }
  if [ -f "$CREDENTIALS_FILE" ]; then
    # shellcheck disable=SC1090
    set -a; . "./$CREDENTIALS_FILE"; set +a
    code=$(curl -s -m 15 -o /dev/null -w '%{http_code}' -H 'content-type: application/json' \
      -d "{\"email\":\"admin@devmentor.test\",\"password\":\"$TEST_ADMIN_PASSWORD\"}" "$base/api/auth/login")
    [ "$code" = 200 ] || { log "authenticated probe failed ($code)"; return 1; }
  fi
  age=$(( $(date -u +%s) - ${started:-0} ))
  [ "$age" -le "$TTL" ] || { log "environment is older than ${TTL}s"; return 1; }
  if newer_than_start; then log "dependencies, migrations or seeders changed since start"; return 1; fi
  return 0
}

if [ "$FORCE" = 0 ] && reusable; then
  base=$(json_get baseUrl "$DESCRIPTOR")
  log "reusing the running environment at $base"
  print_result "$base" 1 "$(json_get installed "$DESCRIPTOR" | sed 's/true/1/;s/false/0/')"
  exit 0
fi

# Anything recorded but not reusable is torn down (only what this repo started).
sh .ai/scripts/test-env-down.sh >/dev/null 2>&1 || true

# --- build cache: skip `npm ci` when the dependency manifests have not changed ---
fp_file() { stat -f '%z:%m' "$1" 2>/dev/null || stat -c '%s:%Y' "$1" 2>/dev/null; }
fingerprint() {
  {
    for p in $BUILD_INPUTS; do
      if [ -d "$p" ]; then
        find "$p" -type f ! -path '*/node_modules/*' ! -path '*/.git/*' ! -path '*/.next*' ! -path '*/coverage/*'
      elif [ -f "$p" ]; then echo "$p"; fi
    done | LC_ALL=C sort | while IFS= read -r f; do printf '%s:%s\n' "$f" "$(fp_file "$f")"; done
    for v in $BUILD_ENV_VARS; do eval "printf 'env:%s=%s\n' \"$v\" \"\${$v:-}\""; done
  } | cksum | awk '{print $1"-"$2}'
}
build_needed() {
  [ "$FORCE_REBUILD" = 1 ] && return 0
  [ -f "$BUILD_CACHE" ] || return 0
  [ "$(json_get sourceFingerprint "$BUILD_CACHE")" = "$(fingerprint)" ] || return 0
  [ "$(json_get projectRoot "$BUILD_CACHE")" = "$ROOT" ] || return 0
  for a in $ARTIFACTS; do [ -s "$a" ] || [ -d "$a" ] || return 0; done
  return 1
}
if build_needed; then
  log "preparing the workspace: $PREP_CHAIN"
  $PREP_CHAIN >&2
  printf '{ "builtAt": "%s", "sourceFingerprint": "%s", "projectRoot": "%s", "artifactPaths": "%s" }\n' \
    "$(now)" "$(fingerprint)" "$ROOT" "$ARTIFACTS" > "$BUILD_CACHE"
  REBUILT=1
else
  log "dependencies unchanged, skipping $PREP_CHAIN"
  REBUILT=0
fi

# --- services: a throwaway PostgreSQL on 127.0.0.1 ---
docker info >/dev/null 2>&1 || { log "Docker is not reachable (start Docker Desktop)"; exit 1; }
DB_PORT=$(pick_port "$DB_PREFERRED_PORT")
docker run -d --rm --name "$CONTAINER" -e POSTGRES_USER="$DB_USER" -e POSTGRES_PASSWORD="$DB_PASSWORD" -e POSTGRES_DB="$DB_NAME" \
  -p "127.0.0.1:$DB_PORT:5432" "$DB_IMAGE" >/dev/null
waited=0
until docker exec "$CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; do
  [ "$waited" -ge 60 ] && { log "PostgreSQL did not become ready in 60s"; docker rm -f "$CONTAINER" >/dev/null 2>&1; exit 1; }
  sleep 1; waited=$((waited + 1))
done
# pg_isready answers during the init restart; give the final server a moment and probe with a query.
until docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c 'select 1' >/dev/null 2>&1; do sleep 1; done
DATABASE_URL="postgres://$DB_USER:$DB_PASSWORD@127.0.0.1:$DB_PORT/$DB_NAME"

APP_PORT=$(pick_port "$APP_PREFERRED_PORT")
BASE_URL="http://127.0.0.1:$APP_PORT"
# Real environment values win over the root .env (process.loadEnvFile never overrides them).
export DATABASE_URL BASE_URL
export AUTH_SECRET="$(random_secret)" SWEEP_SECRET="$(random_secret)" PAYMENTS_PROVIDER=fake APP_URL="$BASE_URL" NEXT_DIST_DIR="$APP_DIST_DIR" PORT="$APP_PORT"

log "migrating and seeding"
npm run db:migrate >&2
npm run db:seed >&2

# Demo passwords, generated per environment, written only to the gitignored credentials file.
umask 077
{
  printf '# Generated by .ai/scripts/test-env-up.sh at %s. Demo values for a disposable environment.\n' "$(now)"
  printf 'SWEEP_SECRET=%s\n' "$SWEEP_SECRET"
} > "$CREDENTIALS_FILE"
CREDENTIALS_JSON=""
for account in $SEED_ACCOUNTS; do
  role=${account%%:*}; email=${account#*:}
  var="TEST_$(printf '%s' "$role" | tr '[:lower:]' '[:upper:]')_PASSWORD"
  password=$(random_secret)
  admin_flag=""; [ "$role" = admin ] && admin_flag="--admin"
  DEVMENTOR_PASSWORD="$password" npm run auth:set-password -- --email "$email" $admin_flag >/dev/null
  printf '%s=%s\n' "$var" "$password" >> "$CREDENTIALS_FILE"
  CREDENTIALS_JSON="$CREDENTIALS_JSON${CREDENTIALS_JSON:+, }{ \"role\": \"$role\", \"username\": \"$email\", \"passwordEnv\": \"$var\" }"
done
umask 022
grep -qxF "$CREDENTIALS_FILE" .gitignore || printf '%s\n' "$CREDENTIALS_FILE" >> .gitignore

# --- app: Next.js dev server in its own process group, bound to 127.0.0.1 ---
log "starting the app on $BASE_URL (log: $APP_LOG)"
set -m
nohup npm run dev -w @devmentor/app -- --hostname 127.0.0.1 --port "$APP_PORT" > "$APP_LOG" 2>&1 &
APP_PID=$!
set +m
waited=0
until curl -fsS -m 5 "$BASE_URL$HEALTH_PATH" 2>/dev/null | grep -q '"database":"ok"'; do
  if ! kill -0 "$APP_PID" 2>/dev/null; then log "the app exited; see $APP_LOG"; docker rm -f "$CONTAINER" >/dev/null 2>&1; exit 1; fi
  [ "$waited" -ge 240 ] && { log "the app was not healthy in 240s; see $APP_LOG"; kill -- -"$APP_PID" 2>/dev/null; docker rm -f "$CONTAINER" >/dev/null 2>&1; exit 1; }
  sleep 2; waited=$((waited + 2))
done
for path in $WARM_UP_PATHS; do curl -s -m 120 -o /dev/null "$BASE_URL$path" || true; done

browser_state
[ "$BROWSER_INSTALLED" = 1 ] && BROWSER_JSON_INSTALLED=true || BROWSER_JSON_INSTALLED=false
UNAME=$(uname -s 2>/dev/null || echo unknown)
case "$UNAME" in
  Linux*) grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null && PLATFORM=wsl2 || PLATFORM=linux ;;
  Darwin*) PLATFORM=darwin ;;
  MINGW*|MSYS*|CYGWIN*) PLATFORM=win32 ;;
  *) PLATFORM=unknown ;;
esac

cat > "$DESCRIPTOR" <<JSON
{
  "version": 1,
  "runId": "$(date -u +%Y%m%d%H%M%S)-$$",
  "status": "running",
  "mode": "ephemeral",
  "baseUrl": "$BASE_URL",
  "startedByThisRepo": true,
  "startScript": ".ai/scripts/test-env-up.sh",
  "stopScript": ".ai/scripts/test-env-down.sh",
  "app": { "startCommand": "npm run dev -w @devmentor/app -- --hostname 127.0.0.1 --port $APP_PORT", "port": $APP_PORT, "healthPath": "$HEALTH_PATH", "pid": $APP_PID },
  "services": [
    { "type": "postgres", "host": "127.0.0.1", "port": $DB_PORT, "container": "$CONTAINER", "url": "$DATABASE_URL", "env": { "DATABASE_URL": "$DATABASE_URL" } }
  ],
  "credentials": [ $CREDENTIALS_JSON ],
  "credentialsFile": "$CREDENTIALS_FILE",
  "browser": {
    "provider": "agent-browser",
    "installed": $BROWSER_JSON_INSTALLED,
    "command": "$BROWSER_BIN",
    "version": "$BROWSER_VERSION",
    "descriptor": ".ai/browsers/agent-browser.md",
    "notes": "$BROWSER_NOTES"
  },
  "testRunner": { "name": "other", "config": "vitest.integration.config.mts (npm run test:integration boots its own environment)" },
  "platform": "$PLATFORM",
  "startedAt": "$(now)",
  "startedAtEpoch": $(date -u +%s),
  "notes": "Fake payments (PAYMENTS_PROVIDER=fake, checkout at /dev/fake-checkout). Seeded by npm run db:seed: admin@, mentor@ (public page /m/demo-mentor, prices set, no slots yet) and mentee@devmentor.test; passwords in credentialsFile. Teardown: sh .ai/scripts/test-env-down.sh. Rebuilt dependencies this run: $REBUILT."
}
JSON

print_result "$BASE_URL" 0 "$BROWSER_INSTALLED"
