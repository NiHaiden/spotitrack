import { createFileRoute } from "@tanstack/react-router"
import {
  getArtistDrilldown,
  triggerBackgroundRecentSync,
} from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export const Route = createFileRoute("/api/stats/artist-detail")({
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

        const artistName = url.searchParams.get("artistName")
        if (!artistName) {
          return json({ error: "Missing artistName" }, 400)
        }

        const details = await getArtistDrilldown(session.user.id, {
          artistName,
          start,
          end,
          limit: 12,
        })

        return json(details)
      },
    },
  },
})
