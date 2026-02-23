import { createFileRoute } from "@tanstack/react-router"
import {
  getTrackSetOverview,
  triggerBackgroundRecentSync,
} from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"
import {
  SpotifyAuthError,
  spotifyGetWithAutoRefresh,
} from "@/lib/server/spotify-api"

type PlaylistTrackItem = {
  track: {
    id: string | null
    name: string
    duration_ms: number
    artists?: Array<{ name: string }>
  } | null
}

type PlaylistResponse = {
  id: string
  name: string
  images?: Array<{ url: string }>
  owner?: { display_name?: string }
  tracks: {
    total: number
    items: PlaylistTrackItem[]
    next: string | null
  }
}

type PlaylistTracksPage = {
  items: PlaylistTrackItem[]
  next: string | null
}

export const Route = createFileRoute("/api/spotify/playlist-insights")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        triggerBackgroundRecentSync(session.user.id)

        const url = new URL(request.url)
        const playlistId = url.searchParams.get("playlistId")

        if (!playlistId) {
          return json({ error: "Missing playlistId" }, 400)
        }

        try {
          const playlist = await spotifyGetWithAutoRefresh<PlaylistResponse>(
            session.user.id,
            `playlists/${playlistId}`,
            {
              limit: 100,
              market: "from_token",
            },
          )

          const tracks: PlaylistTrackItem[] = [...(playlist.tracks.items ?? [])]

          let offset = tracks.length
          let next = playlist.tracks.next
          while (next && offset < Math.max(playlist.tracks.total, 100)) {
            const page = await spotifyGetWithAutoRefresh<PlaylistTracksPage>(
              session.user.id,
              `playlists/${playlistId}/tracks`,
              {
                limit: 100,
                offset,
                market: "from_token",
              },
            )
            tracks.push(...(page.items ?? []))
            offset = tracks.length
            next = page.next
          }

          const trackIds = Array.from(
            new Set(
              tracks
                .map(item => item.track?.id)
                .filter((id): id is string => Boolean(id)),
            ),
          )

          const tracked = await getTrackSetOverview(session.user.id, trackIds, {
            limit: 15,
          })

          return json({
            playlist: {
              id: playlist.id,
              name: playlist.name,
              imageUrl: playlist.images?.[0]?.url ?? null,
              ownerName: playlist.owner?.display_name ?? "Unknown",
              trackCount: playlist.tracks.total,
            },
            tracked,
            coverage: {
              trackedTracks: tracked.totals.uniqueTracks,
              totalTracks: trackIds.length,
            },
          })
        } catch (error) {
          if (error instanceof SpotifyAuthError) {
            return json({ error: error.message }, error.status)
          }
          return json({ error: "Failed to fetch playlist insights" }, 500)
        }
      },
    },
  },
})
