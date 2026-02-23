import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { apiFetch, formatPlayedAt } from "@/lib/spotify-client"
import { IconRefresh, IconUpload } from "@tabler/icons-react"
import {
  recentQueryOptions,
  statsOverviewQueryOptions,
  topArtistsQueryOptions,
  topTracksQueryOptions,
} from "@/lib/spotify-query-options"

type SyncResponse = {
  synced: number
  fetched: number
}

type ImportResponse = {
  importId: string
  inserted: number
  normalized: number
  tracksResolved: number
}

export const Route = createFileRoute("/_authenticated/recent")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(recentQueryOptions(100)),
  component: RecentPage,
})

function RecentPage() {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const recentItemsQuery = useQuery(recentQueryOptions(100))

  const syncMutation = useMutation({
    mutationFn: () =>
      apiFetch<SyncResponse>("/api/spotify/sync-recent", {
        method: "POST",
        body: JSON.stringify({ limit: 50 }),
      }),
    onSuccess: async payload => {
      setInfoMessage(`Synced ${payload.synced} of ${payload.fetched} recent plays.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
        queryClient.invalidateQueries({ queryKey: ["spotify", "playlists"] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: recentQueryOptions(100).queryKey }),
        queryClient.refetchQueries({ queryKey: statsOverviewQueryOptions("30d").queryKey }),
        queryClient.refetchQueries({ queryKey: topTracksQueryOptions("30d").queryKey }),
        queryClient.refetchQueries({ queryKey: topArtistsQueryOptions("30d").queryKey }),
      ])
    },
  })

  const importMutation = useMutation({
    mutationFn: async (selectedFiles: File[]) => {
      const formData = new FormData()
      selectedFiles.forEach(file => {
        formData.append("imports", file)
      })

      const response = await fetch("/api/imports/spotify", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string }
        throw new Error(payload.error ?? `Import failed (${response.status})`)
      }

      return response.json() as Promise<ImportResponse>
    },
    onSuccess: async payload => {
      setInfoMessage(
        `Import finished. Inserted ${payload.inserted}/${payload.normalized} plays, resolved ${payload.tracksResolved} tracks.`,
      )
      setFiles([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
        queryClient.invalidateQueries({ queryKey: ["spotify", "playlists"] }),
      ])
      await queryClient.refetchQueries({ queryKey: recentQueryOptions(100).queryKey })
    },
  })

  const errorMessage =
    (recentItemsQuery.error instanceof Error && recentItemsQuery.error.message) ||
    (syncMutation.error instanceof Error && syncMutation.error.message) ||
    (importMutation.error instanceof Error && importMutation.error.message) ||
    null

  const items = recentItemsQuery.data?.items ?? []

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent Plays</h2>
          <p className="text-muted-foreground">
            Synced and imported listening history.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <IconRefresh className="mr-2 size-4" />
          {syncMutation.isPending ? "Syncing..." : "Sync from Spotify"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Spotify Privacy Data</CardTitle>
          <CardDescription>
            Upload Spotify JSON export files to import older listening history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="file"
            accept="application/json,.json"
            multiple
            onChange={event => setFiles(Array.from(event.currentTarget.files ?? []))}
            className="block w-full text-sm"
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => importMutation.mutate(files)}
              disabled={!files.length || importMutation.isPending}
              variant="secondary"
            >
              <IconUpload className="mr-2 size-4" />
              {importMutation.isPending
                ? "Importing..."
                : `Import ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
            </Button>
            {files.length ? (
              <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {infoMessage ? <p className="text-sm text-emerald-600">{infoMessage}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Listening History</CardTitle>
          <CardDescription>Your latest tracked songs.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentItemsQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-md border p-3">
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : items.length ? (
            <div className="space-y-3">
              {items.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-md border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.trackName}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.artistName}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{formatPlayedAt(item.playedAt)}</p>
                    <p>{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No plays tracked yet. Click “Sync from Spotify” or import JSON history.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
