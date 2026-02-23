import { createFileRoute } from "@tanstack/react-router"
import {
  getTrackDrilldown,
  triggerBackgroundRecentSync,
} from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export const Route = createFileRoute("/api/stats/track-detail")({
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

        const trackId = url.searchParams.get("trackId")
        const trackName = url.searchParams.get("trackName")
        const artistName = url.searchParams.get("artistName")

        if (!trackId && !(trackName && artistName)) {
          return json(
            {
              error:
                "Provide either trackId, or both trackName and artistName.",
            },
            400,
          )
        }

        const details = await getTrackDrilldown(session.user.id, {
          start,
          end,
          trackId,
          trackName,
          artistName,
        })

        return json(details)
      },
    },
  },
})
