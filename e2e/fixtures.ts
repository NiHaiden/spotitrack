// Shared, deterministic test data used by both the mock Spotify API and the
// database seeder. Erasable-only TypeScript so the mock server runs with bare
// `node` (type stripping, Node >= 22.18).

import { createHmac } from "node:crypto"

export const E2E_APP_PORT = Number(process.env.E2E_APP_PORT ?? 3100)
export const E2E_MOCK_PORT = Number(process.env.E2E_MOCK_PORT ?? 3199)
export const E2E_APP_URL = `http://localhost:${E2E_APP_PORT}`
export const E2E_MOCK_URL = `http://localhost:${E2E_MOCK_PORT}`
export const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgres://postgres@127.0.0.1:5432/spotitrack_e2e"
export const E2E_AUTH_SECRET = "Zq3v8KpL2mNw7Xr4Tj9Bc6Hd1Fs5Gy0E-e2e-only"

export const testUser = {
  id: "e2e-user",
  name: "Robin Example",
  email: "robin@example.com",
  sessionToken: "e2e-session-token",
}

export const SESSION_COOKIE = "better-auth.session_token"

// Same format better-call uses for signed cookies: `${value}.${base64(hmac-sha256)}`
export function signCookieValue(value: string, secret = E2E_AUTH_SECRET) {
  const signature = createHmac("sha256", secret).update(value).digest("base64")
  return encodeURIComponent(`${value}.${signature}`)
}

const palette: Array<[string, string]> = [
  ["#f59e0b", "#7c2d12"],
  ["#ec4899", "#4c1d95"],
  ["#22d3ee", "#1e3a8a"],
  ["#84cc16", "#14532d"],
  ["#f97316", "#831843"],
  ["#a78bfa", "#1e1b4b"],
  ["#facc15", "#78350f"],
  ["#2dd4bf", "#134e4a"],
]

export function coverUrl(seed: string) {
  return `${E2E_MOCK_URL}/img/${encodeURIComponent(seed)}.svg`
}

export function coverSvg(seed: string) {
  let hash = 0
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const [from, to] = palette[hash % palette.length]
  const angle = hash % 360
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#g)"/>
  <circle cx="${80 + (hash % 140)}" cy="${80 + ((hash >> 3) % 140)}" r="${60 + (hash % 50)}" fill="#fff" fill-opacity=".12"/>
</svg>`
}

export type FixtureArtist = {
  id: string
  name: string
  weight: number
  tracks: Array<string>
}

// Fictional catalog. Weight = how often the artist shows up in history.
export const artists: Array<FixtureArtist> = [
  { id: "ar-aurora", name: "Aurora Lane", weight: 14, tracks: ["Northern Static", "Glasshouse", "Slow Satellites", "Paper Moons"] },
  { id: "ar-violet", name: "The Violet Hours", weight: 10, tracks: ["Midnight Transit", "Velvet Signal", "Blue Hour"] },
  { id: "ar-kepler", name: "Kepler Drive", weight: 8, tracks: ["Orbitals", "Afterburn", "Low Gravity"] },
  { id: "ar-mara", name: "Mara Okafor", weight: 7, tracks: ["Golden Thread", "Harmattan", "Tide Lines"] },
  { id: "ar-neon", name: "Neon Pastoral", weight: 6, tracks: ["Fieldwork", "Analog Meadow"] },
  { id: "ar-saltwater", name: "Saltwater Kids", weight: 5, tracks: ["Undertow", "Summer Static"] },
  { id: "ar-elm", name: "Elm & Ember", weight: 4, tracks: ["Woodsmoke", "Lantern"] },
  { id: "ar-juno", name: "Juno Reyes", weight: 3, tracks: ["Cartography", "Small Hours"] },
  { id: "ar-pilot", name: "Paper Pilot", weight: 2, tracks: ["Crosswind"] },
  { id: "ar-quiet", name: "Quiet Machines", weight: 2, tracks: ["Idle Loop", "Soft Reset"] },
]

export const tracks = artists.flatMap(artist =>
  artist.tracks.map((name, index) => ({
    id: `tr-${artist.id.slice(3)}-${index}`,
    name,
    artistId: artist.id,
    artistName: artist.name,
    durationMs: 150_000 + ((name.length * 7919) % 120_000),
  })),
)

export type FixturePlaylist = {
  id: string
  name: string
  trackIds: Array<string>
  noImage?: boolean
}

export const playlists: Array<FixturePlaylist> = [
  { id: "pl-focus", name: "Deep Focus", trackIds: tracks.filter((_, i) => i % 2 === 0).map(t => t.id) },
  { id: "pl-night", name: "Night Drive", trackIds: tracks.filter(t => ["ar-violet", "ar-kepler", "ar-quiet"].includes(t.artistId)).map(t => t.id) },
  { id: "pl-sunday", name: "Sunday Morning", trackIds: tracks.filter(t => ["ar-mara", "ar-elm", "ar-juno"].includes(t.artistId)).map(t => t.id) },
  { id: "pl-gym", name: "Gym Rotation", trackIds: tracks.filter(t => ["ar-saltwater", "ar-kepler", "ar-neon"].includes(t.artistId)).map(t => t.id) },
  { id: "pl-empty", name: "Ideas (empty)", trackIds: [], noImage: true },
]

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Builds ~45 days of listening history ending "now". Deterministic for a given `now`
// (rounded to the hour) so every run looks the same apart from the dates.
export type FixturePlay = {
  id: string
  trackId: string
  trackName: string
  artistName: string
  playedAt: Date
  msPlayed: number
  source: string
}

export function buildPlays(now = new Date()): Array<FixturePlay> {
  const random = mulberry32(42)
  const end = new Date(now)
  end.setUTCMinutes(0, 0, 0)
  const totalWeight = artists.reduce((sum, a) => sum + a.weight, 0)
  const pickArtist = () => {
    let roll = random() * totalWeight
    for (const artist of artists) {
      roll -= artist.weight
      if (roll <= 0) return artist
    }
    return artists[0]
  }

  const plays: Array<FixturePlay> = []
  for (let daysAgo = 44; daysAgo >= 0; daysAgo--) {
    const weekend = (new Date(end.getTime() - daysAgo * 86_400_000).getUTCDay() % 6) === 0
    const sessions = 1 + Math.floor(random() * (weekend ? 4 : 3))
    for (let s = 0; s < sessions; s++) {
      // Evening-heavy distribution with a morning commute bump.
      const hour = random() < 0.3 ? 7 + Math.floor(random() * 3) : 17 + Math.floor(random() * 6)
      let cursor = new Date(end.getTime() - daysAgo * 86_400_000)
      cursor.setUTCHours(hour, Math.floor(random() * 60), 0, 0)
      const length = 3 + Math.floor(random() * 8)
      for (let i = 0; i < length; i++) {
        if (cursor.getTime() > end.getTime()) break
        const artist = pickArtist()
        const artistTracks = tracks.filter(t => t.artistId === artist.id)
        const track = artistTracks[Math.floor(random() * random() * artistTracks.length)]
        const skipped = random() < 0.12
        const msPlayed = skipped ? Math.floor(track.durationMs * random() * 0.4) : track.durationMs
        plays.push({
          id: `play-${plays.length}`,
          trackId: track.id,
          trackName: track.name,
          artistName: track.artistName,
          playedAt: new Date(cursor),
          msPlayed,
          source: i % 5 === 0 ? "import-privacy" : "spotify-recent",
        })
        cursor = new Date(cursor.getTime() + msPlayed + 5_000)
      }
    }
  }
  return plays
}
