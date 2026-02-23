# ── Build stage ──
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── Production stage ──
FROM node:22-alpine AS runner

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Only copy the build output — it's self-contained
COPY --from=builder --chown=app:app /app/.output .output

USER app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
