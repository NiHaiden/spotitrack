import { createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  IconClock,
  IconMusic,
  IconPlayerPlay,
  IconUsers,
} from "@tabler/icons-react"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatsRangeSelector } from "@/components/stats-range-selector"
import { BackgroundSyncStatus } from "@/components/background-sync-status"
import { apiFetch, formatDurationShort, formatPlayedAt } from "@/lib/spotify-client"
import {
  dayStatsQueryOptions,
  recentQueryOptions,
  statsOverviewQueryOptions,
} from "@/lib/spotify-query-options"
import { StatsRange } from "@/lib/stats-range"
import { Link } from "@tanstack/react-router"

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
    label: "Hours",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const distributionChartConfig = {
  plays: {
    label: "Plays",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

function DashboardPage() {
  const queryClient = useQueryClient()
  const { user } = Route.useRouteContext()
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
      label: String(hour),
      plays: map.get(hour) ?? 0,
    }))
  }, [byHour])

  const topArtist = topArtists[0]
  const firstName = user?.name?.split(" ")[0] ?? "there"

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[34px]">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your listening activity and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatsRangeSelector value={range} onChange={setRange} />
          <BackgroundSyncStatus />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="SONGS LISTENED"
          value={loading ? "—" : String(totals?.totalPlays ?? 0).toLocaleString()}
          description="Total tracked plays"
          icon={<IconPlayerPlay className="size-4" />}
        />
        <StatCard
          label="TIME LISTENED"
          value={loading ? "—" : formatDurationShort(totals?.totalMsPlayed ?? 0)}
          description="Total listening time"
          icon={<IconClock className="size-4" />}
        />
        <StatCard
          label="ARTISTS"
          value={loading ? "—" : String(totals?.uniqueArtists ?? 0)}
          description="Different artists"
          icon={<IconUsers className="size-4" />}
        />
        <StatCard
          label="UNIQUE TRACKS"
          value={loading ? "—" : String(totals?.uniqueTracks ?? 0)}
          description="Different songs"
          icon={<IconMusic className="size-4" />}
        />
      </div>

      {/* Charts + sidebar */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Listening over time */}
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Listening over time</h3>
              <p className="text-sm text-muted-foreground">Daily hours · last 14 days</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="size-2 rounded-full bg-primary" />
              Hours
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : listeningTimeline.length ? (
            <ChartContainer config={listeningChartConfig} className="h-[400px] w-full overflow-hidden">
              <AreaChart data={listeningTimeline}>
                <defs>
                  <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-hours)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-hours)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeOpacity={0.08} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", opacity: 0.4, fontSize: 12 }}
                  tickFormatter={(v) => {
                    const parts = String(v).split("-")
                    return parts.length === 2 ? `${parts[0].replace(/^0/, "")}/${parts[1].replace(/^0/, "")}` : v
                  }}
                />
                <YAxis tickLine={false} axisLine={false} width={32} tick={{ fill: "currentColor", opacity: 0.4, fontSize: 12 }} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `${value}h`}
                      labelFormatter={(_, payload) => {
                        const raw = payload?.[0]?.payload as { day?: string } | undefined
                        return raw?.day ?? ""
                      }}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--color-hours)"
                  strokeWidth={2}
                  fill="url(#fillHours)"
                  dot={{ r: 2, fill: "var(--color-hours)" }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  onClick={(point) => {
                    const day = (point as { payload?: { day?: string } })?.payload?.day
                    if (day) setSelectedDay(day)
                  }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No listening data yet.</p>
          )}
        </div>

        {/* Right sidebar cards */}
        <div className="flex flex-col gap-4">
          {/* Top Artist card */}
          <div className="flex-1 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                TOP ARTIST
              </p>
              <Link to="/top-artists" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            {loading ? (
              <Skeleton className="h-28 w-full" />
            ) : topArtist ? (
              <>
                <Link
                  to="/top-artists/$artistName"
                  params={{ artistName: encodeURIComponent(topArtist.artistName) }}
                  className="flex items-center gap-4 group"
                >
                  <Avatar className="size-14 rounded-full ring-2 ring-primary/20">
                    <AvatarImage src={topArtist.imageUrl ?? undefined} alt={topArtist.artistName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {topArtist.artistName.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold group-hover:text-primary transition-colors">{topArtist.artistName}</p>
                    <p className="text-sm text-muted-foreground">
                      {topArtist.plays} songs · {formatDurationShort(topArtist.totalMsPlayed)}
                    </p>
                  </div>
                </Link>
                {activeDay && dayDetailsQuery.data ? (
                  <div className="mt-4 flex items-center justify-between border-t border-[oklch(0.17_0_0)] pt-4">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        TODAY · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDurationShort(dayDetailsQuery.data.totals.totalMsPlayed)} listened
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {dayDetailsQuery.data.totals.totalPlays} plays
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No artist data yet.</p>
            )}
          </div>

          {/* Top Today card */}
          <div className="flex-1 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                TOP TODAY
              </p>
              <Link to="/top-tracks" className="text-sm font-medium text-primary hover:underline">View all</Link>
            </div>
            {dayDetailsQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : dayDetailsQuery.data?.topTracks.length ? (
              <div className="space-y-3">
                {dayDetailsQuery.data.topTracks.slice(0, 3).map((track, index) => (
                  <Link
                    key={`${track.trackName}-${index}`}
                    to="/top-tracks/$trackName"
                    params={{ trackName: encodeURIComponent(track.trackName) }}
                    search={{ artist: track.artistName }}
                    className="flex items-start gap-3 group"
                  >
                    <span className="mt-0.5 text-sm font-bold tabular-nums text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium group-hover:text-primary transition-colors">{track.trackName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {track.artistName} · {track.plays} plays
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No plays today.</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: hourly distribution + recent history */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        {/* When you listen */}
        <div className="min-w-0 rounded-2xl border border-border bg-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold">When you listen</h3>
            <p className="text-sm text-muted-foreground">Listening distribution by hour</p>
          </div>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <ChartContainer config={distributionChartConfig} className="h-[400px] w-full overflow-hidden">
              <BarChart data={hourlyDistribution}>
                <CartesianGrid vertical={false} strokeOpacity={0.08} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "currentColor", opacity: 0.4, fontSize: 11 }}
                />
                <YAxis tickLine={false} axisLine={false} width={28} tick={{ fill: "currentColor", opacity: 0.4, fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="plays" fill="var(--color-plays)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        {/* Recent history */}
        <div className="rounded-2xl border border-border bg-card p-6 self-stretch flex flex-col">
          <div className="mb-4 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-lg font-semibold">Recent history</h3>
              <p className="text-sm text-muted-foreground">Latest tracked listens</p>
            </div>
            <Link to="/recent" className="text-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recent.length ? (
            <div className="space-y-1">
              {recent.slice(0, 6).map(item => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconMusic className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.trackName}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.artistName}</p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {new Date(item.playedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-primary/80">
          {label}
        </p>
        <span className="text-muted-foreground/40">{icon}</span>
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
