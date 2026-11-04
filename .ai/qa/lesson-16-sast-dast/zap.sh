#!/usr/bin/env sh
# DAST: OWASP ZAP Baseline (passive) against the local test env (lesson 16, step 5).
# Usage from the repo root, with Docker running:
#   sh .ai/scripts/test-env-up.sh && sh .ai/qa/lesson-16-sast-dast/zap.sh
# Targets only the local app from .ai/qa/test-env.json. Baseline is passive: it spiders and reads
# responses, it does not attack, and a clean report says nothing about authorization.
set -u
cd "$(dirname "$0")/../../.."
OUT="$PWD/.ai/qa/lesson-16-sast-dast"
PORT=$(node -e 'console.log(require("./.ai/qa/test-env.json").app.port)')
# Docker Desktop reaches the host's loopback through host.docker.internal.
TARGET="http://host.docker.internal:$PORT"
DOCKER_HOST="${DOCKER_HOST:-unix://$HOME/.docker/run/docker.sock}" docker run --rm \
  -v "$OUT:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET" -r zap.html -J zap.json -I
echo "ZAP report: $OUT/zap.html"
