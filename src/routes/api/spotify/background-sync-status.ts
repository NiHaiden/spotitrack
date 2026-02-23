import { createFileRoute } from "@tanstack/react-router"
import { getBackgroundSyncStatus } from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

export const Route = createFileRoute("/api/spotify/background-sync-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        const status = await getBackgroundSyncStatus(session.user.id)
        return json(status)
      },
    },
  },
})
