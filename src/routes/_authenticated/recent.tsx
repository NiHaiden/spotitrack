import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { IconClock, IconMusic, IconRefresh, IconUpload } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  EmptyState,
  ErrorNotice,
  PageHeader,
  Panel,
  SourceBadge,
} from "@/components/page"
import { apiFetch, formatDurationShort } from "@/lib/spotify-client"
import {
  formatRelativeDay,
  formatTime,
  formatTrackLength,
  localDayKey,
  plural,
} from "@/lib/format"
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

const PAGE_SIZE = 50

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
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

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

  const allItems = recentItemsQuery.data?.items ?? []
  const items = useMemo(() => allItems.slice(0, visibleCount), [allItems, visibleCount])
  const loading = recentItemsQuery.isPending

  // Group by the viewer's local day, newest first.
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, typeof items>()
    for (const item of items) {
      const day = localDayKey(new Date(item.playedAt))
      const existing = groups.get(day) ?? []
      existing.push(item)
      groups.set(day, existing)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [items])

  function formatDayHeader(day: string) {
    const date = new Date(`${day}T12:00:00`)
    const relative = formatRelativeDay(date)
    const full = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
    return relative === "Today" || relative === "Yesterday"
      ? { title: relative, subtitle: full }
      : { title: full, subtitle: null }
  }

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Recent Plays"
        description={`Your listening timeline · last ${allItems.length} tracked plays`}
        actions={
          <>
            <Button
              variant={showImport ? "secondary" : "outline"}
              onClick={() => setShowImport(!showImport)}
              aria-expanded={showImport}
            >
              <IconUpload />
              Import
            </Button>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <IconRefresh className={syncMutation.isPending ? "animate-spin" : undefined} />
              {syncMutation.isPending ? "Syncing…" : "Sync now"}
            </Button>
          </>
        }
      />

      {showImport ? (
        <Panel
          title="Import Spotify privacy data"
          description="Upload the StreamingHistory JSON files from your Spotify data export to backfill your full history."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-primary/5">
              <IconUpload className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm text-muted-foreground">
                {files.length
                  ? files.map(file => file.name).join(", ")
                  : "Choose .json files…"}
              </span>
              <input
                type="file"
                accept="application/json,.json"
                multiple
                onChange={event => setFiles(Array.from(event.currentTarget.files ?? []))}
                className="sr-only"
              />
            </label>
            <Button
              onClick={() => importMutation.mutate(files)}
              disabled={!files.length || importMutation.isPending}
            >
              {importMutation.isPending
                ? "Importing…"
                : files.length
                  ? `Import ${plural(files.length, "file")}`
                  : "Import"}
            </Button>
          </div>
        </Panel>
      ) : null}

      <ErrorNotice message={errorMessage || null} />
      {infoMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {infoMessage}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : groupedByDay.length ? (
        <div className="space-y-5">
          {groupedByDay.map(([day, dayItems]) => {
            const header = formatDayHeader(day)
            const dayMs = dayItems.reduce((sum, item) => sum + Number(item.msPlayed), 0)
            return (
              <Panel
                key={day}
                flush
                className="overflow-hidden"
                title={
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-primary">{header.title}</span>
                    {header.subtitle ? (
                      <span className="text-[13px] font-normal text-muted-foreground">
                        {header.subtitle}
                      </span>
                    ) : null}
                  </span>
                }
                action={
                  <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                    {plural(dayItems.length, "play")} · {formatDurationShort(dayMs)}
                  </span>
                }
              >
                <ul className="divide-y divide-border">
                  {dayItems.map(item => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-6"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <IconMusic className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.trackName}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.artistName}</p>
                      </div>
                      <div className="hidden w-24 md:block">
                        <SourceBadge source={item.source} />
                      </div>
                      <span className="hidden w-14 text-right text-[13px] text-muted-foreground tabular-nums sm:block">
                        {formatTrackLength(item.msPlayed)}
                      </span>
                      <span className="w-16 text-right text-[13px] text-muted-foreground tabular-nums">
                        {formatTime(item.playedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            )
          })}
          {allItems.length > items.length ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
                Show more ({allItems.length - items.length} left)
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<IconClock className="size-5" />}
          title="No plays yet"
          description="Sync your recently played tracks from Spotify, or import your privacy data export."
          action={
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <IconRefresh className={syncMutation.isPending ? "animate-spin" : undefined} />
              Sync now
            </Button>
          }
        />
      )}
    </div>
  )
}
