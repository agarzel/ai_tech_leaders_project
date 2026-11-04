#!/usr/bin/env sh
# SAST: Semgrep Community Edition over packages/ (lesson 16, step 5).
# Usage from the repo root: sh .ai/qa/lesson-16-sast-dast/semgrep.sh
# Needs `semgrep` on PATH (pipx install semgrep). Metrics are off; results stay local.
set -eu
cd "$(dirname "$0")/../../.."
OUT=.ai/qa/lesson-16-sast-dast
# p/nextjs exists in the registry but is empty (0 rules), so Next.js gets no framework-specific rules.
semgrep scan --metrics=off \
  --config p/default --config p/typescript --config p/javascript --config p/react \
  --config p/owasp-top-ten --config p/secrets --config p/xss --config p/jwt \
  --config p/sql-injection --config p/command-injection --config p/insecure-transport \
  --json --output "$OUT/semgrep.json" packages
