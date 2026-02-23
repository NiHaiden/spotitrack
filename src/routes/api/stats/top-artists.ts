import { createFileRoute } from "@tanstack/react-router"
import {
  getStatsOverview,
  triggerBackgroundRecentSync,
} from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export const Route = createFileRoute("/api/stats/top-artists")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        triggerBackgroundRecentSync(session.user.id)

        const url = new URL(request.url)
        const end = parseDate(url.searchParams.get("end"), new Date())
        const defaultStart = new Date(end)
        defaultStart.setDate(defaultStart.getDate() - 30)
        const start = parseDate(url.searchParams.get("start"), defaultStart)
        const rawLimit = Number(url.searchParams.get("limit") ?? "20")
        const limit = Number.isFinite(rawLimit)
          ? Math.max(1, Math.min(rawLimit, 100))
          : 20

        const stats = await getStatsOverview(session.user.id, {
          start,
          end,
          limit,
        })
        return json({ items: stats.topArtists, interval: stats.interval })
      },
    },
  },
})
