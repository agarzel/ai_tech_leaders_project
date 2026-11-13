#!/bin/sh
# Container entrypoint: with RUN_MIGRATIONS=true, apply migrations first and refuse to start the server if they fail.
# Use it for a single instance (demo, staging); with several replicas, run devmentor-migrate once per deploy instead.
set -eu
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  devmentor-migrate
fi
exec "$@"
