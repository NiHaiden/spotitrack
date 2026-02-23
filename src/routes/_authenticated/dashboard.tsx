import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  IconClock,
  IconPlayerPlay,
  IconRefresh,
  IconUsers,
} from "@tabler/icons-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatsRangeSelector } from "@/components/stats-range-selector"
import { apiFetch, formatDurationShort, formatPlayedAt } from "@/lib/spotify-client"
import {
  dayStatsQueryOptions,
  recentQueryOptions,
  statsOverviewQueryOptions,
} from "@/lib/spotify-query-options"
import { StatsRange } from "@/lib/stats-range"

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(statsOverviewQueryOptions("30d")),
      context.queryClient.ensureQueryData(recentQueryOptions(25)),
    ]),
  component: DashboardPage,
})

const listeningChartConfig = {
  hours: {
    label: "Hours listened",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const distributionChartConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function DashboardPage() {
  const queryClient = useQueryClient()
  const [range, setRange] = useState<StatsRange>("30d")
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const statsQuery = useQuery(statsOverviewQueryOptions(range))
  const recentQuery = useQuery(recentQueryOptions(25))

  const syncMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ synced: number; fetched: number }>("/api/spotify/sync-recent", {
        method: "POST",
        body: JSON.stringify({ limit: 50 }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["stats"] }),
        queryClient.invalidateQueries({ queryKey: ["spotify"] }),
      ])
    },
  })

  const loading = statsQuery.isPending || recentQuery.isPending
  const error =
    statsQuery.error instanceof Error
      ? statsQuery.error.message
      : recentQuery.error instanceof Error
        ? recentQuery.error.message
        : syncMutation.error instanceof Error
          ? syncMutation.error.message
          : null

  const totals = statsQuery.data?.totals
  const topArtists = statsQuery.data?.topArtists ?? []
  const byDay = statsQuery.data?.byDay ?? []
  const byHour = statsQuery.data?.byHour ?? []
  const recent = recentQuery.data?.items ?? []

  const activeDay = selectedDay ?? byDay[byDay.length - 1]?.day ?? null

  const dayDetailsQuery = useQuery(dayStatsQueryOptions(activeDay, 5))

  const listeningTimeline = useMemo(
    () =>
      byDay.map(item => ({
        day: item.day,
        label: item.day.slice(5),
        hours: Number((item.totalMsPlayed / 3_600_000).toFixed(2)),
      })),
    [byDay],
  )

  const hourlyDistribution = useMemo(() => {
    const map = new Map(byHour.map(item => [item.hour, item.plays]))
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      plays: map.get(hour) ?? 0,
    }))
  }, [byHour])

  const topArtist = topArtists[0]

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground">
            Track your listening activity and drill down into each day.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatsRangeSelector value={range} onChange={setRange} />
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <IconRefresh className="mr-2 size-4" />
            {syncMutation.isPending ? "Syncing..." : "Sync now"}
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Songs listened"
          value={loading ? "—" : String(totals?.totalPlays ?? 0)}
          description="Total tracked plays"
          icon={<IconPlayerPlay className="size-4" />}
        />
        <StatCard
          title="Time listened"
          value={loading ? "—" : formatDurationShort(totals?.totalMsPlayed ?? 0)}
          description="Total listening time"
          icon={<IconClock className="size-4" />}
        />
        <StatCard
          title="Artists listened"
          value={loading ? "—" : String(totals?.uniqueArtists ?? 0)}
          description="Different artists"
          icon={<IconUsers className="size-4" />}
        />
        <StatCard
          title="Unique tracks"
          value={loading ? "—" : String(totals?.uniqueTracks ?? 0)}
          description="Different songs"
          icon={<IconUsers className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-9">
          <Card>
            <CardHeader>
              <CardTitle>Time listened over time</CardTitle>
              <CardDescription>Daily listening hours</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : listeningTimeline.length ? (
                <ChartContainer
                  config={listeningChartConfig}
                  className="h-[260px] w-full"
                >
                  <LineChart data={listeningTimeline}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${value}h`}
                          labelFormatter={(_, payload) => {
                            const raw = payload?.[0]?.payload as
                              | { day?: string }
                              | undefined
                            return raw?.day ?? ""
                          }}
                        />
                      }
                    />
                    <Line
                      dataKey="hours"
                      stroke="var(--color-hours)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      onClick={(point) => {
                        const day = (point as { payload?: { day?: string } })?.payload?.day
                        if (day) setSelectedDay(day)
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No listening data yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Listening distribution over day</CardTitle>
              <CardDescription>When you usually listen</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <ChartContainer
                  config={distributionChartConfig}
                  className="h-[260px] w-full"
                >
                  <BarChart data={hourlyDistribution}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} width={32} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="plays" fill="var(--color-plays)" radius={3} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Best artist</CardTitle>
              <CardDescription>Your top artist in this period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : topArtist ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-28 rounded-md">
                      <AvatarImage
                        src={topArtist.imageUrl ?? undefined}
                        alt={topArtist.artistName}
                      />
                      <AvatarFallback>
                        {topArtist.artistName
                          .split(" ")
                          .map(v => v[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-semibold">{topArtist.artistName}</p>
                      <p className="text-xs text-muted-foreground">{topArtist.plays} songs listened</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDurationShort(topArtist.totalMsPlayed)} listened
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No artist data yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected day</CardTitle>
              <CardDescription>{activeDay ?? "No day selected"}</CardDescription>
            </CardHeader>
            <CardContent>
              {!activeDay ? (
                <p className="text-sm text-muted-foreground">Click a data point in the timeline.</p>
              ) : dayDetailsQuery.isPending ? (
                <Skeleton className="h-28 w-full" />
              ) : dayDetailsQuery.data ? (
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-semibold">{dayDetailsQuery.data.totals.totalPlays}</span> plays •{" "}
                    <span className="font-semibold">
                      {formatDurationShort(dayDetailsQuery.data.totals.totalMsPlayed)}
                    </span>
                  </p>
                  <div className="space-y-2">
                    {dayDetailsQuery.data.topTracks.slice(0, 3).map((track, index) => (
                      <div key={`${track.trackName}-${index}`}>
                        <p className="truncate font-medium">{track.trackName}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {track.artistName} • {track.plays}×
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No details available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your history</CardTitle>
          <CardDescription>Most recent tracked listens</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Track / Artist</th>
                    <th className="pb-2 pr-4 font-medium">Source</th>
                    <th className="pb-2 font-medium">Listened at</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(item => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        <p className="truncate font-medium">{item.trackName}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.artistName}</p>
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{item.source}</td>
                      <td className="py-2 text-xs text-muted-foreground">{formatPlayedAt(item.playedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No history yet. Sync from Spotify first.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
