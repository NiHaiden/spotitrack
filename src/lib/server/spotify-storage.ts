import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  sql,
} from "drizzle-orm"
import { db } from "@/db"
import {
  spotifyAlbum,
  spotifyArtist,
  spotifyImport,
  spotifyPlay,
  spotifyTrack,
  spotifyTrackArtist,
} from "@/db/schema"
import { spotifyGetWithAutoRefresh } from "@/lib/server/spotify-api"

const backgroundSyncLocks = new Map<string, number>()
const BACKGROUND_SYNC_COOLDOWN_MS = 2 * 60 * 1000

export type SpotifyImage = {
  url: string
}

export type SpotifyArtistPayload = {
  id: string
  name: string
  genres?: string[]
  popularity?: number
  images?: SpotifyImage[]
}

export type SpotifyAlbumPayload = {
  id: string
  name: string
  release_date?: string
  images?: SpotifyImage[]
}

export type SpotifyTrackPayload = {
  id: string
  name: string
  duration_ms: number
  explicit: boolean
  popularity: number
  preview_url: string | null
  uri: string
  album: SpotifyAlbumPayload
  artists: SpotifyArtistPayload[]
}

export type SpotifyRecentlyPlayedItem = {
  track: SpotifyTrackPayload
  played_at: string
}

type ClassicPrivacyEntry = {
  endTime: string
  artistName: string
  trackName: string
  msPlayed: number
}

type ExtendedPrivacyEntry = {
  ts: string
  ms_played: number
  spotify_track_uri: string | null
  master_metadata_track_name: string | null
  master_metadata_album_artist_name: string | null
}

type NormalizedEntry = {
  playedAt: Date
  msPlayed: number
  trackName: string
  artistName: string
  spotifyTrackId?: string
}

function isClassicPrivacyEntry(value: unknown): value is ClassicPrivacyEntry {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.endTime === "string" &&
    typeof candidate.artistName === "string" &&
    typeof candidate.trackName === "string" &&
    typeof candidate.msPlayed === "number"
  )
}

function isExtendedPrivacyEntry(value: unknown): value is ExtendedPrivacyEntry {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.ts === "string" &&
    typeof candidate.ms_played === "number" &&
    (typeof candidate.spotify_track_uri === "string" ||
      candidate.spotify_track_uri === null)
  )
}

function toTrackIdFromSpotifyUri(uri: string | null | undefined) {
  if (!uri) {
    return undefined
  }

  const parts = uri.split(":")
  const last = parts[parts.length - 1]
  return last && last.length > 0 ? last : undefined
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

async function enrichArtistsWithSpotifyData(
  userId: string,
  artists: Map<string, SpotifyArtistPayload>,
) {
  const ids = Array.from(artists.keys())
  if (!ids.length) {
    return
  }

  for (const batch of chunk(ids, 50)) {
    const response = await spotifyGetWithAutoRefresh<{
      artists: Array<
        | {
            id: string
            name: string
            genres?: string[]
            popularity?: number
            images?: SpotifyImage[]
          }
        | null
      >
    }>(userId, "artists", {
      ids: batch.join(","),
    })

    for (const artist of response.artists) {
      if (!artist) {
        continue
      }

      const existing = artists.get(artist.id)
      artists.set(artist.id, {
        id: artist.id,
        name: artist.name,
        genres: artist.genres ?? existing?.genres,
        popularity: artist.popularity ?? existing?.popularity,
        images: artist.images ?? existing?.images,
      })
    }
  }
}

export async function upsertSpotifyMetadata(
  userId: string,
  tracks: SpotifyTrackPayload[],
) {
  if (tracks.length === 0) {
    return
  }

  const now = new Date()

  const artists = new Map<string, SpotifyArtistPayload>()
  const albums = new Map<string, SpotifyAlbumPayload>()

  for (const track of tracks) {
    albums.set(track.album.id, track.album)
    for (const artist of track.artists) {
      artists.set(artist.id, artist)
    }
  }

  await enrichArtistsWithSpotifyData(userId, artists)

  await db
    .insert(spotifyArtist)
    .values(
      Array.from(artists.values()).map(artist => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres ?? [],
        popularity: artist.popularity ?? null,
        images: artist.images ?? [],
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: spotifyArtist.id,
      set: {
        name: sql`excluded.name`,
        genres: sql`excluded.genres`,
        popularity: sql`excluded.popularity`,
        images: sql`excluded.images`,
        updatedAt: now,
      },
    })

  await db
    .insert(spotifyAlbum)
    .values(
      Array.from(albums.values()).map(album => ({
        id: album.id,
        name: album.name,
        releaseDate: album.release_date ?? null,
        images: album.images ?? [],
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(spotifyTrack)
    .values(
      tracks.map(track => ({
        id: track.id,
        albumId: track.album.id,
        name: track.name,
        durationMs: track.duration_ms,
        explicit: track.explicit,
        popularity: track.popularity,
        previewUrl: track.preview_url,
        uri: track.uri,
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing()

  const links = tracks.flatMap(track =>
    track.artists.map((artist, index) => ({
      trackId: track.id,
      artistId: artist.id,
      position: index,
    })),
  )

  if (links.length > 0) {
    await db.insert(spotifyTrackArtist).values(links).onConflictDoNothing()
  }
}

type PlayInsert = {
  userId: string
  trackId?: string
  trackName: string
  artistName: string
  playedAt: Date
  msPlayed: number
  source: string
  importId?: string
}

export async function storeListeningEvents(items: PlayInsert[]) {
  if (items.length === 0) {
    return 0
  }

  const inserted = await db
    .insert(spotifyPlay)
    .values(
      items.map(item => ({
        id: crypto.randomUUID(),
        userId: item.userId,
        trackId: item.trackId,
        trackName: item.trackName,
        artistName: item.artistName,
        playedAt: item.playedAt,
        msPlayed: item.msPlayed,
        source: item.source,
        importId: item.importId,
        createdAt: new Date(),
      })),
    )
    .onConflictDoNothing({
      target: [
        spotifyPlay.userId,
        spotifyPlay.playedAt,
        spotifyPlay.trackName,
        spotifyPlay.artistName,
      ],
    })
    .returning({ id: spotifyPlay.id })

  return inserted.length
}

export async function syncRecentPlaysFromSpotify(userId: string, limit = 50) {
  const response = await spotifyGetWithAutoRefresh<{
    items: SpotifyRecentlyPlayedItem[]
  }>(userId, "me/player/recently-played", { limit })

  const items = response.items ?? []
  const tracks = items.map(item => item.track)

  await upsertSpotifyMetadata(userId, tracks)

  const inserted = await storeListeningEvents(
    items.map(item => ({
      userId,
      trackId: item.track.id,
      trackName: item.track.name,
      artistName: item.track.artists[0]?.name ?? "Unknown Artist",
      playedAt: new Date(item.played_at),
      msPlayed: item.track.duration_ms,
      source: "spotify-recent",
    })),
  )

  return {
    fetched: items.length,
    inserted,
  }
}

export function triggerBackgroundRecentSync(userId: string, limit = 50) {
  const now = Date.now()
  const lastRun = backgroundSyncLocks.get(userId)

  if (lastRun && now - lastRun < BACKGROUND_SYNC_COOLDOWN_MS) {
    return false
  }

  backgroundSyncLocks.set(userId, now)

  void syncRecentPlaysFromSpotify(userId, limit)
    .catch(() => {
      // best-effort background sync, errors are intentionally ignored
    })
    .finally(() => {
      backgroundSyncLocks.set(userId, Date.now())
    })

  return true
}

async function fetchTracksByIds(userId: string, ids: string[]) {
  const unique = Array.from(new Set(ids))
  if (unique.length === 0) {
    return new Map<string, SpotifyTrackPayload>()
  }

  const found = new Map<string, SpotifyTrackPayload>()

  for (const batch of chunk(unique, 50)) {
    const response = await spotifyGetWithAutoRefresh<{
      tracks: Array<SpotifyTrackPayload | null>
    }>(userId, "tracks", { ids: batch.join(",") })

    for (const track of response.tracks) {
      if (track) {
        found.set(track.id, track)
      }
    }
  }

  return found
}

async function searchTrack(
  userId: string,
  trackName: string,
  artistName: string,
): Promise<SpotifyTrackPayload | null> {
  const response = await spotifyGetWithAutoRefresh<{
    tracks: { items: SpotifyTrackPayload[] }
  }>(userId, "search", {
    q: `track:${trackName} artist:${artistName}`,
    type: "track",
    limit: 1,
  })

  return response.tracks.items[0] ?? null
}

function normalizeImportedEntries(entries: unknown[]): NormalizedEntry[] {
  const normalized: NormalizedEntry[] = []

  for (const raw of entries) {
    if (isClassicPrivacyEntry(raw)) {
      if (raw.msPlayed < 30_000) {
        continue
      }

      normalized.push({
        playedAt: new Date(`${raw.endTime}:00Z`),
        msPlayed: raw.msPlayed,
        trackName: raw.trackName,
        artistName: raw.artistName,
      })
      continue
    }

    if (isExtendedPrivacyEntry(raw)) {
      if (
        raw.ms_played < 30_000 ||
        !raw.master_metadata_track_name ||
        !raw.master_metadata_album_artist_name
      ) {
        continue
      }

      normalized.push({
        playedAt: new Date(raw.ts),
        msPlayed: raw.ms_played,
        trackName: raw.master_metadata_track_name,
        artistName: raw.master_metadata_album_artist_name,
        spotifyTrackId: toTrackIdFromSpotifyUri(raw.spotify_track_uri),
      })
    }
  }

  return normalized
}

export async function importStreamingHistory(
  userId: string,
  entries: unknown[],
  type: "privacy" | "full-privacy" = "privacy",
) {
  const importId = crypto.randomUUID()

  await db.insert(spotifyImport).values({
    id: importId,
    userId,
    type,
    status: "processing",
    totalRows: entries.length,
    processedRows: 0,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  try {
    const normalized = normalizeImportedEntries(entries)

    const trackIdSet = new Set<string>()
    for (const entry of normalized) {
      if (entry.spotifyTrackId) {
        trackIdSet.add(entry.spotifyTrackId)
      }
    }

    const tracksById = await fetchTracksByIds(userId, Array.from(trackIdSet))

    const searchCache = new Map<string, SpotifyTrackPayload | null>()
    for (const entry of normalized) {
      if (entry.spotifyTrackId && tracksById.has(entry.spotifyTrackId)) {
        continue
      }

      const key = `${entry.trackName}:::${entry.artistName}`
      if (!searchCache.has(key)) {
        searchCache.set(
          key,
          await searchTrack(userId, entry.trackName, entry.artistName),
        )
      }

      const resolved = searchCache.get(key)
      if (resolved) {
        tracksById.set(resolved.id, resolved)
      }
    }

    await upsertSpotifyMetadata(userId, Array.from(tracksById.values()))

    const toInsert: PlayInsert[] = normalized.map(entry => {
      let resolvedTrack =
        (entry.spotifyTrackId && tracksById.get(entry.spotifyTrackId)) || null

      if (!resolvedTrack) {
        const key = `${entry.trackName}:::${entry.artistName}`
        resolvedTrack = searchCache.get(key) ?? null
      }

      return {
        userId,
        trackId: resolvedTrack?.id,
        trackName: resolvedTrack?.name ?? entry.trackName,
        artistName:
          resolvedTrack?.artists[0]?.name ?? entry.artistName ?? "Unknown Artist",
        playedAt: entry.playedAt,
        msPlayed: entry.msPlayed,
        source: `import-${type}`,
        importId,
      }
    })

    const inserted = await storeListeningEvents(toInsert)

    await db
      .update(spotifyImport)
      .set({
        status: "success",
        processedRows: normalized.length,
        metadata: {
          inserted,
          normalized: normalized.length,
          tracksResolved: tracksById.size,
        },
        updatedAt: new Date(),
      })
      .where(eq(spotifyImport.id, importId))

    return {
      importId,
      inserted,
      normalized: normalized.length,
      tracksResolved: tracksById.size,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown import error"

    await db
      .update(spotifyImport)
      .set({
        status: "failure",
        error: message,
        updatedAt: new Date(),
      })
      .where(eq(spotifyImport.id, importId))

    throw error
  }
}

export async function getImportsForUser(userId: string) {
  return db
    .select()
    .from(spotifyImport)
    .where(eq(spotifyImport.userId, userId))
    .orderBy(desc(spotifyImport.createdAt))
}

export async function getStatsOverview(
  userId: string,
  options?: {
    start?: Date
    end?: Date
    limit?: number
  },
) {
  const start =
    options?.start ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  const end = options?.end ?? new Date()
  const limit = options?.limit ?? 10

  const where = and(
    eq(spotifyPlay.userId, userId),
    gte(spotifyPlay.playedAt, start),
    lte(spotifyPlay.playedAt, end),
  )

  const [totals] = await db
    .select({
      totalPlays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
      uniqueArtists: sql<number>`count(distinct ${spotifyPlay.artistName})`,
      uniqueTracks: sql<number>`count(distinct coalesce(${spotifyPlay.trackId}, ${spotifyPlay.trackName} || '::' || ${spotifyPlay.artistName}))`,
    })
    .from(spotifyPlay)
    .where(where)

  const topTracks = await db
    .select({
      trackId: spotifyPlay.trackId,
      trackName: spotifyPlay.trackName,
      artistName: spotifyPlay.artistName,
      plays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
    })
    .from(spotifyPlay)
    .where(where)
    .groupBy(spotifyPlay.trackId, spotifyPlay.trackName, spotifyPlay.artistName)
    .orderBy(desc(count()), desc(sql`sum(${spotifyPlay.msPlayed})`))
    .limit(limit)

  const topArtistsBase = await db
    .select({
      artistName: spotifyPlay.artistName,
      plays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
    })
    .from(spotifyPlay)
    .where(where)
    .groupBy(spotifyPlay.artistName)
    .orderBy(desc(count()), desc(sql`sum(${spotifyPlay.msPlayed})`))
    .limit(limit)

  const artistNames = Array.from(new Set(topArtistsBase.map(item => item.artistName)))
  const artistRows = artistNames.length
    ? await db
        .select({
          name: spotifyArtist.name,
          images: spotifyArtist.images,
        })
        .from(spotifyArtist)
        .where(inArray(spotifyArtist.name, artistNames))
    : []

  const artistImageMap = new Map<string, string | null>()
  for (const artist of artistRows) {
    if (artistImageMap.has(artist.name)) {
      continue
    }

    const images = Array.isArray(artist.images)
      ? (artist.images as Array<{ url?: string }>)
      : []
    const imageUrl = images.find(image => typeof image?.url === "string")?.url ?? null
    artistImageMap.set(artist.name, imageUrl)
  }

  const topArtists = topArtistsBase.map(item => ({
    ...item,
    imageUrl: artistImageMap.get(item.artistName) ?? null,
  }))

  const byDay = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${spotifyPlay.playedAt}), 'YYYY-MM-DD')`,
      plays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
    })
    .from(spotifyPlay)
    .where(where)
    .groupBy(sql`date_trunc('day', ${spotifyPlay.playedAt})`)
    .orderBy(sql`date_trunc('day', ${spotifyPlay.playedAt}) asc`)

  const byHour = await db
    .select({
      hour: sql<number>`extract(hour from ${spotifyPlay.playedAt})::int`,
      plays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
    })
    .from(spotifyPlay)
    .where(where)
    .groupBy(sql`extract(hour from ${spotifyPlay.playedAt})`)
    .orderBy(sql`extract(hour from ${spotifyPlay.playedAt}) asc`)

  return {
    interval: {
      start,
      end,
    },
    totals: {
      totalPlays: totals?.totalPlays ?? 0,
      totalMsPlayed: totals?.totalMsPlayed ?? 0,
      uniqueArtists: totals?.uniqueArtists ?? 0,
      uniqueTracks: totals?.uniqueTracks ?? 0,
    },
    topTracks,
    topArtists,
    byDay,
    byHour,
  }
}

export async function getDayStats(userId: string, day: string, limit = 5) {
  const start = new Date(`${day}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  const where = and(
    eq(spotifyPlay.userId, userId),
    gte(spotifyPlay.playedAt, start),
    lte(spotifyPlay.playedAt, end),
  )

  const [totals] = await db
    .select({
      totalPlays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
      uniqueArtists: sql<number>`count(distinct ${spotifyPlay.artistName})`,
      uniqueTracks: sql<number>`count(distinct coalesce(${spotifyPlay.trackId}, ${spotifyPlay.trackName} || '::' || ${spotifyPlay.artistName}))`,
    })
    .from(spotifyPlay)
    .where(where)

  const topTracks = await db
    .select({
      trackName: spotifyPlay.trackName,
      artistName: spotifyPlay.artistName,
      plays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
    })
    .from(spotifyPlay)
    .where(where)
    .groupBy(spotifyPlay.trackName, spotifyPlay.artistName)
    .orderBy(desc(count()), desc(sql`sum(${spotifyPlay.msPlayed})`))
    .limit(limit)

  const topArtists = await db
    .select({
      artistName: spotifyPlay.artistName,
      plays: count(),
      totalMsPlayed: sql<number>`coalesce(sum(${spotifyPlay.msPlayed}), 0)`,
    })
    .from(spotifyPlay)
    .where(where)
    .groupBy(spotifyPlay.artistName)
    .orderBy(desc(count()), desc(sql`sum(${spotifyPlay.msPlayed})`))
    .limit(limit)

  return {
    day,
    totals: {
      totalPlays: totals?.totalPlays ?? 0,
      totalMsPlayed: totals?.totalMsPlayed ?? 0,
      uniqueArtists: totals?.uniqueArtists ?? 0,
      uniqueTracks: totals?.uniqueTracks ?? 0,
    },
    topTracks,
    topArtists,
  }
}

export async function getStoredRecentPlays(userId: string, limit = 50) {
  return db
    .select({
      id: spotifyPlay.id,
      playedAt: spotifyPlay.playedAt,
      msPlayed: spotifyPlay.msPlayed,
      trackId: spotifyPlay.trackId,
      trackName: spotifyPlay.trackName,
      artistName: spotifyPlay.artistName,
      source: spotifyPlay.source,
    })
    .from(spotifyPlay)
    .where(eq(spotifyPlay.userId, userId))
    .orderBy(desc(spotifyPlay.playedAt))
    .limit(limit)
}

export async function getStoredTrackDetails(trackIds: string[]) {
  if (trackIds.length === 0) {
    return []
  }

  return db
    .select()
    .from(spotifyTrack)
    .where(inArray(spotifyTrack.id, trackIds))
}
