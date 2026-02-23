import { queryOptions } from "@tanstack/react-query"
import { apiFetch } from "@/lib/spotify-client"
import { StatsRange, statsRangeStart } from "@/lib/stats-range"

export type StatsOverview = {
  interval: {
    start: string
    end: string
  }
  totals: {
    totalPlays: number
    totalMsPlayed: number
    uniqueArtists: number
    uniqueTracks: number
  }
  topTracks: Array<{
    trackId: string | null
    trackName: string
    artistName: string
    plays: number
    totalMsPlayed: number
  }>
  topArtists: Array<{
    artistName: string
    plays: number
    totalMsPlayed: number
    imageUrl: string | null
  }>
  byDay: Array<{
    day: string
    plays: number
    totalMsPlayed: number
  }>
  byHour: Array<{
    hour: number
    plays: number
    totalMsPlayed: number
  }>
}

export type TopTracksResponse = {
  items: StatsOverview["topTracks"]
}

export type TopArtistsResponse = {
  items: StatsOverview["topArtists"]
}

export type RecentResponse = {
  items: Array<{
    id: string
    playedAt: string
    msPlayed: number
    trackId: string | null
    trackName: string
    artistName: string
    source: string
  }>
}

export type PlaylistResponse = {
  items: Array<{
    id: string
    name: string
    public: boolean | null
    tracks?: { total?: number }
    owner?: { display_name?: string }
    images?: Array<{ url: string }>
  }>
}

export type DayStatsResponse = {
  day: string
  totals: {
    totalPlays: number
    totalMsPlayed: number
    uniqueArtists: number
    uniqueTracks: number
  }
  topTracks: Array<{
    trackName: string
    artistName: string
    plays: number
    totalMsPlayed: number
  }>
  topArtists: Array<{
    artistName: string
    plays: number
    totalMsPlayed: number
  }>
}

export type TrackDetailResponse = {
  totals: {
    totalPlays: number
    totalMsPlayed: number
  }
  byDay: Array<{
    day: string
    plays: number
    totalMsPlayed: number
  }>
  byHour: Array<{
    hour: number
    plays: number
  }>
  recent: Array<{
    id: string
    playedAt: string
    source: string
  }>
}

export type ArtistDetailResponse = {
  totals: {
    totalPlays: number
    totalMsPlayed: number
    uniqueTracks: number
  }
  topTracks: Array<{
    trackId: string | null
    trackName: string
    plays: number
    totalMsPlayed: number
  }>
  byDay: Array<{
    day: string
    plays: number
    totalMsPlayed: number
  }>
}

export type PlaylistInsightsResponse = {
  playlist: {
    id: string
    name: string
    imageUrl: string | null
    ownerName: string
    trackCount: number
  }
  tracked: {
    totals: {
      totalPlays: number
      totalMsPlayed: number
      uniqueTracks: number
    }
    topTracks: Array<{
      trackId: string | null
      trackName: string
      artistName: string
      plays: number
      totalMsPlayed: number
    }>
    byDay: Array<{
      day: string
      plays: number
      totalMsPlayed: number
    }>
  }
  coverage: {
    trackedTracks: number
    totalTracks: number
  }
}

export type BackgroundSyncStatusResponse = {
  isRunning: boolean
  cooldownMsRemaining: number
  lastTriggeredAt: string | null
  lastCompletedAt: string | null
  lastErrorAt: string | null
  lastPersistedAt: string | null
  lastPersistedPlayedAt: string | null
}

function buildStatsParams(range: StatsRange, limit: number) {
  const start = statsRangeStart(range).toISOString()
  const end = new Date().toISOString()
  return `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${limit}`
}

function rangeDates(range: StatsRange) {
  return {
    start: statsRangeStart(range).toISOString(),
    end: new Date().toISOString(),
  }
}

export const statsOverviewQueryOptions = (range: StatsRange = "30d") =>
  queryOptions({
    queryKey: ["stats", "overview", range],
    queryFn: () =>
      apiFetch<StatsOverview>(
        `/api/stats/overview?${buildStatsParams(range, 10)}`,
      ),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

export const topTracksQueryOptions = (range: StatsRange = "30d") =>
  queryOptions({
    queryKey: ["stats", "top-tracks", range],
    queryFn: () =>
      apiFetch<TopTracksResponse>(
        `/api/stats/top-tracks?${buildStatsParams(range, 50)}`,
      ),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

export const topArtistsQueryOptions = (range: StatsRange = "30d") =>
  queryOptions({
    queryKey: ["stats", "top-artists", range],
    queryFn: () =>
      apiFetch<TopArtistsResponse>(
        `/api/stats/top-artists?${buildStatsParams(range, 40)}`,
      ),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

export const recentQueryOptions = (limit = 100) =>
  queryOptions({
    queryKey: ["stats", "recent", limit],
    queryFn: () => apiFetch<RecentResponse>(`/api/stats/recent?limit=${limit}`),
    staleTime: 15_000,
    refetchInterval: 30_000,
  })

export const dayStatsQueryOptions = (day: string | null, limit = 5) =>
  queryOptions({
    queryKey: ["stats", "day", day, limit],
    queryFn: () => {
      if (!day) {
        throw new Error("Day is required")
      }
      return apiFetch<DayStatsResponse>(
        `/api/stats/day?day=${encodeURIComponent(day)}&limit=${limit}`,
      )
    },
    enabled: Boolean(day),
    staleTime: 30_000,
  })

export const trackDetailQueryOptions = (
  range: StatsRange,
  params: {
    trackId?: string | null
    trackName?: string | null
    artistName?: string | null
  } | null,
) =>
  queryOptions({
    queryKey: ["stats", "track-detail", range, params],
    queryFn: () => {
      if (!params) {
        throw new Error("Track params are required")
      }

      const { start, end } = rangeDates(range)
      const search = new URLSearchParams({
        start,
        end,
      })

      if (params.trackId) {
        search.set("trackId", params.trackId)
      }

      if (params.trackName) {
        search.set("trackName", params.trackName)
      }

      if (params.artistName) {
        search.set("artistName", params.artistName)
      }

      return apiFetch<TrackDetailResponse>(`/api/stats/track-detail?${search.toString()}`)
    },
    enabled: Boolean(params),
    staleTime: 30_000,
  })

export const artistDetailQueryOptions = (
  range: StatsRange,
  artistName: string | null,
) =>
  queryOptions({
    queryKey: ["stats", "artist-detail", range, artistName],
    queryFn: () => {
      if (!artistName) {
        throw new Error("artistName is required")
      }

      const { start, end } = rangeDates(range)
      return apiFetch<ArtistDetailResponse>(
        `/api/stats/artist-detail?artistName=${encodeURIComponent(artistName)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      )
    },
    enabled: Boolean(artistName),
    staleTime: 30_000,
  })

export const playlistsQueryOptions = (limit = 50) =>
  queryOptions({
    queryKey: ["spotify", "playlists", limit],
    queryFn: () =>
      apiFetch<PlaylistResponse>(`/api/spotify/playlists?limit=${limit}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

export const backgroundSyncStatusQueryOptions = () =>
  queryOptions({
    queryKey: ["spotify", "background-sync-status"],
    queryFn: () =>
      apiFetch<BackgroundSyncStatusResponse>(
        "/api/spotify/background-sync-status",
      ),
    staleTime: 5_000,
    refetchInterval: 10_000,
  })

export const playlistInsightsQueryOptions = (playlistId: string | null) =>
  queryOptions({
    queryKey: ["spotify", "playlist-insights", playlistId],
    queryFn: () => {
      if (!playlistId) {
        throw new Error("playlistId is required")
      }
      return apiFetch<PlaylistInsightsResponse>(
        `/api/spotify/playlist-insights?playlistId=${encodeURIComponent(playlistId)}`,
      )
    },
    enabled: Boolean(playlistId),
    staleTime: 45_000,
  })
