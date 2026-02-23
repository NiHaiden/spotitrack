import { createFileRoute } from "@tanstack/react-router"
import { json, requireSession } from "@/lib/server/session"
import { SpotifyAuthError, spotifyGetWithAutoRefresh } from "@/lib/server/spotify-api"

type SpotifyPagingResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

const validTimeRanges = new Set(["short_term", "medium_term", "long_term"])

export const Route = createFileRoute("/api/spotify/top-artists")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        const url = new URL(request.url)
        const rawLimit = Number(url.searchParams.get("limit") ?? "20")
        const limit = Number.isFinite(rawLimit)
          ? Math.max(1, Math.min(rawLimit, 50))
          : 20

        const rawTimeRange = url.searchParams.get("timeRange") ?? "medium_term"
        const timeRange = validTimeRanges.has(rawTimeRange)
          ? rawTimeRange
          : "medium_term"

        try {
          const payload = await spotifyGetWithAutoRefresh<SpotifyPagingResponse<Record<string, unknown>>>(
            session.user.id,
            "me/top/artists",
            {
              limit,
              time_range: timeRange,
            },
          )

          return json(payload)
        } catch (error) {
          if (error instanceof SpotifyAuthError) {
            return json({ error: error.message }, error.status)
          }
          return json({ error: "Failed to fetch top artists" }, 500)
        }
      },
    },
  },
})
