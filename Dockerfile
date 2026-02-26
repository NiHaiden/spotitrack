# Build stage
FROM node:22-alpine AS builder

ARG APP_VERSION=dev
ARG GIT_HASH=unknown

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Bake version into the client bundle via Vite env vars
ENV NODE_ENV=production
ENV VITE_APP_VERSION=$APP_VERSION
ENV VITE_GIT_HASH=$GIT_HASH
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm and postgresql-client for pg_isready
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && apk add --no-cache postgresql-client

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (need tsx for migrations)
RUN pnpm install --frozen-lockfile

# Copy drizzle migrations folder
COPY drizzle ./drizzle

# Copy migration script
COPY scripts/migrate.ts ./scripts/migrate.ts

# Copy built application
COPY --from=builder /app/.output ./.output

# Copy startup script
COPY scripts/start.sh ./scripts/start.sh
RUN chmod +x ./scripts/start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run startup script
CMD ["./scripts/start.sh"]
