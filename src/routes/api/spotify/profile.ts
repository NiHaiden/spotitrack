import { createFileRoute } from "@tanstack/react-router"
import { json, requireSession } from "@/lib/server/session"
import { SpotifyAuthError, spotifyGetWithAutoRefresh } from "@/lib/server/spotify-api"

export const Route = createFileRoute("/api/spotify/profile")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        try {
          const profile = await spotifyGetWithAutoRefresh<Record<string, unknown>>(
            session.user.id,
            "me",
          )
          return json(profile)
        } catch (error) {
          if (error instanceof SpotifyAuthError) {
            return json({ error: error.message }, error.status)
          }
          return json({ error: "Failed to fetch Spotify profile" }, 500)
        }
      },
    },
  },
})
