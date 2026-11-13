FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/app/package.json ./packages/app/
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Only what `npm run db:migrate` needs (MikroORM CLI, tsx, the db package), from the same lockfile: ~50 MB instead of
# the full workspace install. The standalone server below cannot run migrations on its own.
FROM node:24-alpine AS migrator
WORKDIR /app/migrator
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages/app/package.json ./packages/app/
COPY packages/core/package.json ./packages/core/
COPY packages/db/package.json ./packages/db/
COPY packages/ui/package.json ./packages/ui/
RUN npm ci --workspace @devmentor/db --ignore-scripts --no-audit --no-fund
COPY packages/db ./packages/db

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
# Standalone output of a monorepo keeps the workspace layout: server lives in packages/app.
COPY --from=builder --chown=nextjs:nodejs /app/packages/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/app/.next/static ./packages/app/.next/static
COPY --from=builder /app/packages/app/public ./packages/app/public
COPY --from=migrator /app/migrator ./migrator
# `devmentor-migrate` applies pending migrations (DATABASE_URL from the environment). The entrypoint runs it before the
# server when RUN_MIGRATIONS=true; otherwise run it as a one-off (pre-deploy command, compose `migrate` service).
COPY --chmod=755 docker/migrate.sh /usr/local/bin/devmentor-migrate
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/devmentor-entrypoint
USER nextjs
EXPOSE 3000
ENTRYPOINT ["devmentor-entrypoint"]
CMD ["node", "packages/app/server.js"]
