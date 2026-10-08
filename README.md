# Spotitrack

Track your Spotify listening history, explore top artists and tracks, and import streaming data exports.

## Local development

```bash
# Start Postgres (+ optional Caddy reverse-proxy)
docker compose up -d

# Install deps
pnpm install

# Push DB schema
pnpm db:push

# Copy & edit env
cp .env.example .env
# Fill in your Spotify OAuth credentials (https://developer.spotify.com/dashboard)

# Dev server on :3001 (Caddy proxies :3000 → :3001)
pnpm dev
```

## End-to-end tests

Playwright drives a production build against a seeded Postgres database and a
local mock of the Spotify API (`e2e/mock-spotify.ts`), so no Spotify account or
network access is needed. Requires Node ≥ 22.18.

```bash
# Uses postgres://postgres@127.0.0.1:5432/spotitrack_e2e by default.
# The database is wiped and re-seeded on every run — don't point it at real data.
export E2E_DATABASE_URL=postgres://user:pass@localhost:5432/spotitrack_e2e

pnpm test:e2e               # desktop + mobile suites (builds the app first)
pnpm test:e2e:screenshots   # every page, light/dark × desktop/mobile → e2e/screenshots/
```

Set `E2E_SKIP_BUILD=1` to reuse an existing `.output/` build.

## Production deployment

### 1. Docker Compose (recommended)

```bash
# Copy the example env and fill in real values
cp .env.example .env.prod
# Edit .env.prod — set strong passwords, your domain, Spotify creds

# Build & start
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Push the DB schema (one-time, or after schema changes)
DATABASE_URL=postgres://spotitrack:<password>@localhost:5432/spotitrack pnpm db:push
```

The app will be available on port 3000.

### 2. Standalone Node.js

```bash
pnpm install
pnpm build

# Set all required env vars (see .env.example), then:
node .output/server/index.mjs
```

The build produces a self-contained `.output/` directory — no `node_modules` needed at runtime.

### 3. Spotify OAuth setup

1. Go to https://developer.spotify.com/dashboard
2. Create an app (or use existing)
3. Add your redirect URI: `https://yourdomain.com/api/auth/callback/spotify`
4. Copy Client ID + Secret into your `.env`

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Postgres connection string |
| `BETTER_AUTH_URL` | ✅ | Your public app URL (e.g. `https://spotitrack.example.com`) |
| `BETTER_AUTH_SECRET` | ✅ | Random secret for session signing (≥32 chars) |
| `SPOTIFY_CLIENT_ID` | ✅ | Spotify OAuth client ID |
| `SPOTIFY_CLIENT_SECRET` | ✅ | Spotify OAuth client secret |
| `SPOTIFY_REDIRECT_URI` | ✅ | OAuth callback URL |
| `VITE_BETTER_AUTH_URL` | ✅ | Same as `BETTER_AUTH_URL` (inlined into client build) |
| `BETTER_AUTH_TRUSTED_ORIGINS` | ❌ | Comma-separated allowed origins |
| `PORT` | ❌ | Server port (default: `3000`) |
| `HOST` | ❌ | Listen address (default: `0.0.0.0`) |

## Tech stack

- **Framework:** TanStack Start (React 19 + Nitro SSR)
- **Routing:** TanStack Router
- **Data:** TanStack Query + Drizzle ORM + PostgreSQL
- **Auth:** Better Auth + Spotify OAuth
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts
