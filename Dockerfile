# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat ffmpeg \
  && corepack enable \
  && corepack prepare pnpm@11.18.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/media/package.json packages/media/package.json
COPY packages/observability/package.json packages/observability/package.json
COPY packages/storage/package.json packages/storage/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN APP_ENV=test pnpm --filter @movie/web build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=25s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["pnpm", "--filter", "@movie/web", "start"]
