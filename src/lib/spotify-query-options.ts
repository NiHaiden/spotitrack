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

function buildStatsParams(range: StatsRange, limit: number) {
  const start = statsRangeStart(range).toISOString()
  const end = new Date().toISOString()
  return `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&limit=${limit}`
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

export const playlistsQueryOptions = (limit = 50) =>
  queryOptions({
    queryKey: ["spotify", "playlists", limit],
    queryFn: () => apiFetch<PlaylistResponse>(`/api/spotify/playlists?limit=${limit}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
