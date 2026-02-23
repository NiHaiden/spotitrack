import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { IconRefresh } from "@tabler/icons-react"
import {
  playlistInsightsQueryOptions,
  playlistsQueryOptions,
} from "@/lib/spotify-query-options"
import { formatDurationShort } from "@/lib/spotify-client"

export const Route = createFileRoute("/_authenticated/playlists")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(playlistsQueryOptions(50)),
  component: PlaylistsPage,
})

const playlistTrendChartConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const playlistTracksChartConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

function PlaylistsPage() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)

  const playlistsQuery = useQuery(playlistsQueryOptions(50))
  const playlists = playlistsQuery.data?.items ?? []

  const selectedPlaylist = useMemo(() => {
    if (!playlists.length) {
      return null
    }

    return (
      playlists.find(playlist => playlist.id === selectedPlaylistId) ?? playlists[0] ?? null
    )
  }, [playlists, selectedPlaylistId])

  const insightsQuery = useQuery(
    playlistInsightsQueryOptions(selectedPlaylist?.id ?? null),
  )

  const byDayData = (insightsQuery.data?.tracked.byDay ?? []).map(day => ({
    ...day,
    label: day.day.slice(5),
  }))

  const topTrackData = (insightsQuery.data?.tracked.topTracks ?? []).slice(0, 10)

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Playlists</h2>
          <p className="text-muted-foreground">
            Drill into how much you actually listen to each playlist.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => playlistsQuery.refetch()}
          disabled={playlistsQuery.isFetching}
        >
          <IconRefresh className="mr-2 size-4" />
          {playlistsQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {playlistsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{playlistsQuery.error.message}</p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <p className="text-sm font-semibold">Your playlists</p>
          </CardHeader>
          <CardContent>
            {playlistsQuery.isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : playlists.length ? (
              <div className="space-y-2">
                {playlists.map(playlist => {
                  const isActive = playlist.id === selectedPlaylist?.id
                  const image = playlist.images?.[0]?.url

                  return (
                    <button
                      key={playlist.id}
                      type="button"
                      className={`flex w-full items-center gap-3 rounded-md border p-2 text-left transition ${
                        isActive ? "border-primary bg-primary/5" : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedPlaylistId(playlist.id)}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={playlist.name}
                          className="size-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex size-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                          No art
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{playlist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {playlist.tracks?.total ?? 0} tracks
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No playlists found.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader>
              <p className="text-sm font-semibold">Playlist insights</p>
              <p className="text-xs text-muted-foreground">
                {insightsQuery.data?.playlist.name ?? selectedPlaylist?.name ?? "Select a playlist"}
              </p>
            </CardHeader>
            <CardContent>
              {insightsQuery.isPending ? (
                <Skeleton className="h-48 w-full" />
              ) : insightsQuery.error instanceof Error ? (
                <p className="text-sm text-destructive">{insightsQuery.error.message}</p>
              ) : insightsQuery.data ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Tracked plays</p>
                    <p className="text-xl font-semibold">{insightsQuery.data.tracked.totals.totalPlays}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Listening time</p>
                    <p className="text-xl font-semibold">
                      {formatDurationShort(insightsQuery.data.tracked.totals.totalMsPlayed)}
                    </p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Coverage</p>
                    <p className="text-xl font-semibold">
                      {insightsQuery.data.coverage.trackedTracks}/{insightsQuery.data.coverage.totalTracks}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a playlist to load insights.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <p className="text-sm font-semibold">Playlist plays over time</p>
              </CardHeader>
              <CardContent>
                {insightsQuery.isPending ? (
                  <Skeleton className="h-72 w-full" />
                ) : byDayData.length ? (
                  <ChartContainer config={playlistTrendChartConfig} className="h-72 w-full">
                    <BarChart data={byDayData} margin={{ top: 12, right: 12, left: 0, bottom: 10 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="plays" fill="var(--color-plays)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No tracked plays for this playlist.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm font-semibold">Top playlist tracks (tracked)</p>
              </CardHeader>
              <CardContent>
                {insightsQuery.isPending ? (
                  <Skeleton className="h-72 w-full" />
                ) : topTrackData.length ? (
                  <ChartContainer config={playlistTracksChartConfig} className="h-72 w-full">
                    <BarChart
                      data={topTrackData.map(track => ({
                        label:
                          track.trackName.length > 18
                            ? `${track.trackName.slice(0, 18)}…`
                            : track.trackName,
                        plays: track.plays,
                      }))}
                      layout="vertical"
                      margin={{ top: 10, right: 12, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="label" width={140} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="plays" fill="var(--color-plays)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">No tracked tracks yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
