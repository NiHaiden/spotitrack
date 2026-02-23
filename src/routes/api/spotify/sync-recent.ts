import { createFileRoute } from "@tanstack/react-router"
import { json, requireSession } from "@/lib/server/session"
import { SpotifyAuthError } from "@/lib/server/spotify-api"
import { syncRecentPlaysFromSpotify } from "@/lib/server/spotify-storage"

export const Route = createFileRoute("/api/spotify/sync-recent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        const body = (await request
          .json()
          .catch(() => ({}))) as { limit?: number }

        const rawLimit = Number(body.limit ?? 50)
        const limit = Number.isFinite(rawLimit)
          ? Math.max(1, Math.min(rawLimit, 50))
          : 50

        try {
          const result = await syncRecentPlaysFromSpotify(session.user.id, limit)

          return json({
            synced: result.inserted,
            fetched: result.fetched,
          })
        } catch (error) {
          if (error instanceof SpotifyAuthError) {
            return json({ error: error.message }, error.status)
          }
          return json({ error: "Failed to sync recent plays" }, 500)
        }
      },
    },
  },
})
