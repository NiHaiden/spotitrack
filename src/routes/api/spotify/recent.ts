import { createFileRoute } from "@tanstack/react-router"
import { json, requireSession } from "@/lib/server/session"
import { SpotifyAuthError, spotifyGetWithAutoRefresh } from "@/lib/server/spotify-api"

export const Route = createFileRoute("/api/spotify/recent")({
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

        try {
          const payload = await spotifyGetWithAutoRefresh<Record<string, unknown>>(
            session.user.id,
            "me/player/recently-played",
            {
              limit,
            },
          )

          return json(payload)
        } catch (error) {
          if (error instanceof SpotifyAuthError) {
            return json({ error: error.message }, error.status)
          }
          return json({ error: "Failed to fetch recent plays" }, 500)
        }
      },
    },
  },
})
