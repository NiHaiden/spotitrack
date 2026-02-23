import { createFileRoute } from "@tanstack/react-router"
import {
  getStatsOverview,
  triggerBackgroundRecentSync,
} from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

function parseDate(value: string | null, fallback: Date) {
  if (!value) {
    return fallback
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return fallback
  }

  return parsed
}

export const Route = createFileRoute("/api/stats/overview")({
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

        const rawLimit = Number(url.searchParams.get("limit") ?? "10")
        const limit = Number.isFinite(rawLimit)
          ? Math.max(1, Math.min(rawLimit, 100))
          : 10

        const stats = await getStatsOverview(session.user.id, {
          start,
          end,
          limit,
        })
        return json(stats)
      },
    },
  },
})
