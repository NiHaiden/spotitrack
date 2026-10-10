import { mkdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import {
  E2E_APP_URL,
  E2E_DATABASE_URL,
  SESSION_COOKIE,
  artists,
  buildPlays,
  coverUrl,
  signCookieValue,
  testUser,
  tracks,
} from "./fixtures.ts"

const STORAGE_STATE = path.join(import.meta.dirname, ".auth", "user.json")

async function resetDatabase(sql: postgres.Sql) {
  await sql.unsafe(`
    drop schema if exists public cascade;
    drop schema if exists drizzle cascade;
    create schema public;
  `)
  await migrate(drizzle(sql), {
    migrationsFolder: path.join(import.meta.dirname, "..", "drizzle"),
  })
}

async function seed(sql: postgres.Sql) {
  const now = new Date()
  // postgres.js wants strings for untyped timestamp params.
  const in30Days = new Date(now.getTime() + 30 * 86_400_000).toISOString()

  await sql`
    insert into "user" (id, name, email, email_verified, image)
    values (${testUser.id}, ${testUser.name}, ${testUser.email}, true, ${coverUrl("avatar")})
  `
  await sql`
    insert into account (id, account_id, provider_id, user_id, access_token, refresh_token, access_token_expires_at, scope)
    values ('e2e-account', 'spotify-e2e', 'spotify', ${testUser.id}, 'e2e-access-token', 'e2e-refresh-token', ${in30Days}, 'user-read-recently-played')
  `
  await sql`
    insert into session (id, expires_at, token, user_id)
    values ('e2e-session', ${in30Days}, ${testUser.sessionToken}, ${testUser.id})
  `

  // Leave the last artist without an image so fallbacks are exercised.
  await sql`
    insert into spotify_artist ${sql(
      artists.map((artist, index) => ({
        id: artist.id,
        name: artist.name,
        images: JSON.stringify(
          index === artists.length - 1 ? [] : [{ url: coverUrl(artist.id) }],
        ),
      })),
    )}
  `
  await sql`
    insert into spotify_track ${sql(
      tracks.map(track => ({
        id: track.id,
        name: track.name,
        duration_ms: track.durationMs,
      })),
    )}
  `
  await sql`
    insert into spotify_track_artist ${sql(
      tracks.map(track => ({ track_id: track.id, artist_id: track.artistId })),
    )}
  `

  const plays = buildPlays(now)
  for (let i = 0; i < plays.length; i += 500) {
    await sql`
      insert into spotify_play ${sql(
        plays.slice(i, i + 500).map(play => ({
          id: play.id,
          user_id: testUser.id,
          track_id: play.trackId,
          track_name: play.trackName,
          artist_name: play.artistName,
          played_at: play.playedAt.toISOString(),
          ms_played: play.msPlayed,
          source: play.source,
        })),
      )}
    `
  }
}

export default async function globalSetup() {
  const sql = postgres(E2E_DATABASE_URL, { max: 1, onnotice: () => {} })
  try {
    await resetDatabase(sql)
    await seed(sql)
  } finally {
    await sql.end()
  }

  const { hostname } = new URL(E2E_APP_URL)
  mkdirSync(path.dirname(STORAGE_STATE), { recursive: true })
  writeFileSync(
    STORAGE_STATE,
    JSON.stringify({
      cookies: [
        {
          // better-auth drops the __Secure- prefix when BETTER_AUTH_URL is http.
          name: SESSION_COOKIE,
          value: signCookieValue(testUser.sessionToken),
          domain: hostname,
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  )
}
