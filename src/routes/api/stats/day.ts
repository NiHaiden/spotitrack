import { createFileRoute } from "@tanstack/react-router"
import { getDayStats, triggerBackgroundRecentSync } from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

export const Route = createFileRoute("/api/stats/day")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        triggerBackgroundRecentSync(session.user.id)

        const url = new URL(request.url)
        const day = url.searchParams.get("day")
        const rawLimit = Number(url.searchParams.get("limit") ?? "5")
        const limit = Number.isFinite(rawLimit)
          ? Math.max(1, Math.min(rawLimit, 20))
          : 5

        if (!day) {
          return json({ error: "Missing day query parameter (YYYY-MM-DD)" }, 400)
        }

        const stats = await getDayStats(session.user.id, day, limit)
        return json(stats)
      },
    },
  },
})
