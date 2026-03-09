import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { apiFetch, formatPlayedAt } from "@/lib/spotify-client"
import { IconFilter, IconMusic, IconRefresh, IconUpload } from "@tabler/icons-react"
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
    context.queryClient.ensureQueryData(recentQueryOptions(200)),
  component: RecentPage,
})

function RecentPage() {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)

  const recentItemsQuery = useQuery(recentQueryOptions(200))

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
        queryClient.refetchQueries({ queryKey: recentQueryOptions(200).queryKey }),
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
      setShowImport(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
        queryClient.invalidateQueries({ queryKey: ["spotify", "playlists"] }),
      ])
      await queryClient.refetchQueries({ queryKey: recentQueryOptions(200).queryKey })
    },
  })

  const errorMessage =
    (recentItemsQuery.error instanceof Error && recentItemsQuery.error.message) ||
    (syncMutation.error instanceof Error && syncMutation.error.message) ||
    (importMutation.error instanceof Error && importMutation.error.message) ||
    null

  const items = recentItemsQuery.data?.items ?? []
  const loading = recentItemsQuery.isPending

  // Group items by day
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, typeof items>()
    for (const item of items) {
      const day = String(item.playedAt).slice(0, 10)
      const existing = groups.get(day) ?? []
      existing.push(item)
      groups.set(day, existing)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  function formatDayHeader(day: string) {
    const date = new Date(day + "T12:00:00")
    const today = new Date()
    const todayStr = today.toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (day === todayStr) return `Today · ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    if (day === yesterday) return `Yesterday · ${date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  }

  function formatDuration(ms: number | null | undefined) {
    if (!ms) return "—"
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[34px]">Recent Plays</h1>
          <p className="text-sm text-muted-foreground">Your complete listening timeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-1.5 rounded-[10px] bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconUpload className="size-3.5" />
            Import
          </button>
          <button
            type="button"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-1.5 rounded-[10px] bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <IconRefresh className={`size-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync"}
          </button>
        </div>
      </div>

      {/* Import section */}
      {showImport ? (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-lg font-semibold">Import Spotify Privacy Data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload Spotify JSON exports to backfill your full history.
          </p>
          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept="application/json,.json"
              multiple
              onChange={event => setFiles(Array.from(event.currentTarget.files ?? []))}
              className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary/20"
            />
            <Button
              onClick={() => importMutation.mutate(files)}
              disabled={!files.length || importMutation.isPending}
              size="sm"
            >
              {importMutation.isPending
                ? "Importing..."
                : `Import ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {infoMessage ? <p className="text-sm text-emerald-500">{infoMessage}</p> : null}

      {/* Recent plays table grouped by day */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : groupedByDay.length ? (
        <div className="space-y-6">
          {groupedByDay.map(([day, dayItems]) => (
            <div key={day}>
              <p className="mb-3 text-[13px] font-semibold text-primary">
                {formatDayHeader(day)}
              </p>
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/50">
                      <th className="px-6 py-3.5">TRACK / ARTIST</th>
                      <th className="px-4 py-3.5 hidden md:table-cell w-[120px]">SOURCE</th>
                      <th className="px-4 py-3.5 text-right hidden sm:table-cell w-[100px]">DURATION</th>
                      <th className="px-6 py-3.5 text-right w-20">TIME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayItems.map(item => (
                      <tr key={item.id} className="border-b border-border last:border-0">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-4">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                              <IconMusic className="size-3.5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium leading-[18px]">{item.trackName}</p>
                              <p className="truncate text-xs text-muted-foreground leading-4">{item.artistName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            <span className="text-sm text-muted-foreground">{item.source}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] tabular-nums text-muted-foreground hidden sm:table-cell">
                          {formatDuration(item.msPlayed)}
                        </td>
                        <td className="px-6 py-3 text-right text-[13px] tabular-nums text-muted-foreground/60">
                          {new Date(item.playedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">No recent plays yet. Sync from Spotify first.</p>
        </div>
      )}
    </div>
  )
}
