#!/bin/sh
# om-prepare-test-env: generated teardown (contract v2)
# history:
#   2026-10-27 generated together with test-env-up.sh
# Stops exactly what test-env-up.sh started (app process group, scoped database container). Safe to run twice.
set -eu

ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT"
DESCRIPTOR=".ai/qa/test-env.json"
CONTAINER="devmentor-test-env-$(printf '%s' "$ROOT" | cksum | awk '{print $1}')"

json_get() { sed -n "s/.*\"$1\": *\"\{0,1\}\([^\",}]*\)\"\{0,1\}.*/\1/p" "$2" 2>/dev/null | head -n 1 | sed 's/[[:space:]]*$//'; }

if [ -f "$DESCRIPTOR" ] && [ "$(json_get startedByThisRepo "$DESCRIPTOR")" = true ]; then
  pid=$(json_get pid "$DESCRIPTOR")
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    # The app was started in its own process group (npm -> next); stop the whole group.
    kill -TERM -- -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
    kill -KILL -- -"$pid" 2>/dev/null || true
  fi
  sed -i.bak 's/"status": "running"/"status": "stopped"/' "$DESCRIPTOR" && rm -f "$DESCRIPTOR.bak"
fi

# Only the container name this checkout's up script uses; nothing else is touched.
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
fi
echo "TEST_ENV_STATUS=stopped"
