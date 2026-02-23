import { createFileRoute } from "@tanstack/react-router"
import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { spotifyImport } from "@/db/schema"
import { json, requireSession } from "@/lib/server/session"

export const Route = createFileRoute("/api/imports")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await requireSession(request)
        if (!session) {
          return json({ error: "Unauthorized" }, 401)
        }

        const imports = await db
          .select({
            id: spotifyImport.id,
            type: spotifyImport.type,
            status: spotifyImport.status,
            totalRows: spotifyImport.totalRows,
            processedRows: spotifyImport.processedRows,
            error: spotifyImport.error,
            createdAt: spotifyImport.createdAt,
            updatedAt: spotifyImport.updatedAt,
          })
          .from(spotifyImport)
          .where(eq(spotifyImport.userId, session.user.id))
          .orderBy(desc(spotifyImport.createdAt))

        return json({ imports })
      },
    },
  },
})
