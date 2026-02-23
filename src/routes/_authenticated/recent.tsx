import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
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
    context.queryClient.ensureQueryData(recentQueryOptions(200)),
  component: RecentPage,
})

const recentTrendConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const recentHourConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function RecentPage() {
  const queryClient = useQueryClient()
  const [files, setFiles] = useState<File[]>([])
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

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

  const byDay = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      const day = String(item.playedAt).slice(0, 10)
      map.set(day, (map.get(day) ?? 0) + 1)
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, plays]) => ({ day, label: day.slice(5), plays }))
  }, [items])

  const activeDay = selectedDay ?? byDay[byDay.length - 1]?.day ?? null

  const dayItems = useMemo(
    () => items.filter(item => String(item.playedAt).slice(0, 10) === activeDay),
    [items, activeDay],
  )

  const byHour = useMemo(() => {
    const map = new Map<number, number>()
    for (let hour = 0; hour < 24; hour += 1) {
      map.set(hour, 0)
    }

    for (const item of dayItems) {
      const hour = new Date(item.playedAt).getHours()
      map.set(hour, (map.get(hour) ?? 0) + 1)
    }

    return Array.from(map.entries()).map(([hour, plays]) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      plays,
    }))
  }, [dayItems])

  const loading = recentItemsQuery.isPending

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Recent Plays</h2>
          <p className="text-muted-foreground">
            Track imports, syncs, and drill into your latest listening sessions.
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
            Upload Spotify JSON exports to backfill your full history.
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plays per day</CardTitle>
            <CardDescription>Click a day to inspect hours and songs.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : byDay.length ? (
              <ChartContainer config={recentTrendConfig} className="h-72 w-full">
                <BarChart
                  data={byDay}
                  margin={{ top: 12, right: 12, left: 0, bottom: 10 }}
                  onClick={event => {
                    const day =
                      event && typeof event === "object" && "activePayload" in event
                        ? (event.activePayload as Array<{ payload?: { day?: string } }> | undefined)?.[0]
                            ?.payload?.day
                        : undefined

                    if (day) {
                      setSelectedDay(String(day))
                    }
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="plays" fill="var(--color-plays)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly breakdown</CardTitle>
            <CardDescription>
              {activeDay ? `For ${activeDay}` : "Select a day"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : byHour.length ? (
              <ChartContainer config={recentHourConfig} className="h-72 w-full">
                <BarChart data={byHour} margin={{ top: 12, right: 12, left: 0, bottom: 10 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="label" tickFormatter={value => String(value).slice(0, 2)} />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="plays" fill="var(--color-plays)" radius={4} />
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No hourly data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Day drilldown</CardTitle>
          <CardDescription>
            {activeDay ? `Showing listens for ${activeDay}` : "No day selected"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : dayItems.length ? (
            <div className="space-y-2">
              {dayItems.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0">
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
            <p className="text-sm text-muted-foreground">No plays found for this day.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
