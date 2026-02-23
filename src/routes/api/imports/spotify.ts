import { createFileRoute } from "@tanstack/react-router"
import { importStreamingHistory } from "@/lib/server/spotify-storage"
import { json, requireSession } from "@/lib/server/session"

type JsonImportBody = {
  entries?: unknown[]
}

async function extractEntriesFromMultipart(request: Request) {
  const form = await request.formData()
  const fileCandidates = [
    ...form.getAll("files"),
    ...form.getAll("imports"),
  ]

  const entries: unknown[] = []

  for (const value of fileCandidates) {
    if (!(value instanceof File)) {
      continue
    }

    const text = await value.text()
    const parsed = JSON.parse(text) as unknown
    if (Array.isArray(parsed)) {
      entries.push(...parsed)
    }
  }

  return entries
}

async function extractEntries(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as JsonImportBody
    return Array.isArray(body.entries) ? body.entries : []
  }

  if (contentType.includes("multipart/form-data")) {
    return extractEntriesFromMultipart(request)
  }

  return []
}

export const Route = createFileRoute("/api/imports/spotify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        try {
          const entries = await extractEntries(request)
          if (entries.length === 0) {
            return json({ error: "No import entries found" }, 400)
          }

          const result = await importStreamingHistory(session.user.id, entries)
          return json(result)
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Spotify import failed"

          return json({ error: message }, 500)
        }
      },
    },
  },
})
