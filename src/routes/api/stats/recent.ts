import { createFileRoute } from "@tanstack/react-router"
import {
  getStoredRecentPlays,
  triggerBackgroundRecentSync,
} from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

export const Route = createFileRoute("/api/stats/recent")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        triggerBackgroundRecentSync(session.user.id)

        const url = new URL(request.url)
        const rawLimit = Number(url.searchParams.get("limit") ?? "50")
        const limit = Number.isFinite(rawLimit)
          ? Math.max(1, Math.min(rawLimit, 200))
          : 50

        const recent = await getStoredRecentPlays(session.user.id, limit)
        return json({ items: recent })
      },
    },
  },
})
