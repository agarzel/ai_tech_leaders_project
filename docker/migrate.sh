#!/bin/sh
# Applies pending database migrations with the MikroORM CLI shipped in the image (/app/migrator).
set -eu
cd /app/migrator/packages/db
exec npm run --silent db:migrate
