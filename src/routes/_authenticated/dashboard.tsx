import { Link, createFileRoute } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  IconClock,
  IconMusic,
  IconPlayerPlay,
  IconUsers,
} from "@tabler/icons-react"
import type * as React from "react"
import type { StatsRange } from "@/lib/stats-range"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StatsRangeSelector } from "@/components/stats-range-selector"
import { BackgroundSyncStatus } from "@/components/background-sync-status"
import {
  HourChart,
  TrendChart,
  fillDayGaps,
  formatMinutesTick,
  peakHour,
} from "@/components/charts"
import {
  EmptyState,
  ErrorNotice,
  Eyebrow,
  PageHeader,
  Panel,
  PanelLink,
} from "@/components/page"
import { formatDurationShort } from "@/lib/spotify-client"
import {
  formatDayLong,
  formatHourLong,
  formatRelativeDay,
  formatTime,
  localDayKey,
  plural,
} from "@/lib/format"
import {
  dayStatsQueryOptions,
  recentQueryOptions,
  statsOverviewQueryOptions,
} from "@/lib/spotify-query-options"
import { statsRangeLabel, statsRangeStart } from "@/lib/stats-range"

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(statsOverviewQueryOptions("30d")),
      context.queryClient.ensureQueryData(recentQueryOptions(25)),
    ]),
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useRouteContext()
  const [range, setRange] = useState<StatsRange>("30d")
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const statsQuery = useQuery(statsOverviewQueryOptions(range))
  const recentQuery = useQuery(recentQueryOptions(25))

  const loading = statsQuery.isPending
  const error =
    (statsQuery.error instanceof Error && statsQuery.error.message) ||
    (recentQuery.error instanceof Error && recentQuery.error.message) ||
    null

  const totals = statsQuery.data?.totals
  const topArtists = statsQuery.data?.topArtists ?? []
  const byDay = statsQuery.data?.byDay ?? []
  const byHour = statsQuery.data?.byHour ?? []
  const recent = recentQuery.data?.items ?? []

  const listeningTimeline = useMemo(
    () =>
      fillDayGaps(
        byDay.map(item => ({
          day: item.day,
          value: Math.round(Number(item.totalMsPlayed) / 60_000),
        })),
        day => ({ day, value: 0 }),
        { from: range === "all" ? undefined : statsRangeStart(range), to: new Date() },
      ),
    [byDay, range],
  )

  const lastDay = byDay[byDay.length - 1]?.day ?? null
  const activeDay = selectedDay ?? lastDay
  const dayDetailsQuery = useQuery(dayStatsQueryOptions(activeDay, 5))

  const activeDayLabel = activeDay
    ? formatRelativeDay(new Date(`${activeDay}T12:00:00`))
    : null
  const activeDayIsToday = activeDay === localDayKey(new Date())

  const daysInRange = Math.max(listeningTimeline.length, 1)
  const topArtist = topArtists[0]
  const firstName = user.name.split(" ")[0] || "there"
  const peak = peakHour(byHour)

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your listening activity and insights"
        actions={
          <>
            <StatsRangeSelector value={range} onChange={setRange} />
            <BackgroundSyncStatus />
          </>
        }
      />

      <ErrorNotice message={error} />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Plays"
          loading={loading}
          value={(totals?.totalPlays ?? 0).toLocaleString()}
          description={`≈ ${Math.round((totals?.totalPlays ?? 0) / daysInRange)} per day`}
          icon={<IconPlayerPlay className="size-4" />}
        />
        <StatCard
          label="Time listened"
          loading={loading}
          value={formatDurationShort(Number(totals?.totalMsPlayed ?? 0))}
          description={`≈ ${formatDurationShort(Number(totals?.totalMsPlayed ?? 0) / daysInRange)} per day`}
          icon={<IconClock className="size-4" />}
        />
        <StatCard
          label="Artists"
          loading={loading}
          value={Number(totals?.uniqueArtists ?? 0).toLocaleString()}
          description="Different artists"
          icon={<IconUsers className="size-4" />}
        />
        <StatCard
          label="Unique tracks"
          loading={loading}
          value={Number(totals?.uniqueTracks ?? 0).toLocaleString()}
          description="Different songs"
          icon={<IconMusic className="size-4" />}
        />
      </div>

      {/* Listening over time + highlights */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Listening over time"
          description={`Time per day · ${statsRangeLabel(range)} · click a day for details`}
        >
          {loading ? (
            <Skeleton className="h-[260px] w-full sm:h-[300px]" />
          ) : listeningTimeline.length ? (
            <TrendChart
              data={listeningTimeline}
              label="Listened"
              valueFormatter={minutes => formatDurationShort(minutes * 60_000)}
              yTickFormatter={formatMinutesTick}
              selectedDay={activeDay}
              onSelectDay={setSelectedDay}
            />
          ) : (
            <EmptyState
              icon={<IconClock className="size-5" />}
              title="No listening data yet"
              description="Plays show up here once SpotiTrack has synced with Spotify."
            />
          )}
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title={<Eyebrow>Top artist</Eyebrow>}
            action={<PanelLink to="/top-artists">View all</PanelLink>}
          >
            {loading ? (
              <Skeleton className="h-14 w-full" />
            ) : topArtist ? (
              <Link
                to="/top-artists/$artistName"
                params={{ artistName: encodeURIComponent(topArtist.artistName) }}
                className="group flex items-center gap-4"
              >
                <Avatar className="size-14 ring-2 ring-primary/20">
                  <AvatarImage src={topArtist.imageUrl ?? undefined} alt={topArtist.artistName} />
                  <AvatarFallback className="bg-primary text-lg font-bold text-primary-foreground">
                    {topArtist.artistName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold transition-colors group-hover:text-primary">
                    {topArtist.artistName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plural(topArtist.plays, "play")} ·{" "}
                    {formatDurationShort(Number(topArtist.totalMsPlayed))}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">No artist data yet.</p>
            )}
          </Panel>

          <Panel
            className="flex-1"
            title={
              <Eyebrow>
                {activeDayLabel ? `${activeDayLabel} · Top tracks` : "Top tracks"}
              </Eyebrow>
            }
            action={
              selectedDay && selectedDay !== lastDay ? (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="text-[13px] font-medium text-primary hover:text-primary/80"
                >
                  Reset
                </button>
              ) : (
                <PanelLink to="/top-tracks">View all</PanelLink>
              )
            }
          >
            {dayDetailsQuery.isPending && activeDay ? (
              <Skeleton className="h-36 w-full" />
            ) : dayDetailsQuery.data ? (
              <div className="space-y-4">
                <div className="flex items-baseline justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-2.5">
                  <p className="text-sm text-muted-foreground">
                    {formatDurationShort(Number(dayDetailsQuery.data.totals.totalMsPlayed))} listened
                    {activeDay && !activeDayIsToday ? (
                      <span className="hidden sm:inline"> · {formatDayLong(activeDay)}</span>
                    ) : null}
                  </p>
                  <p className="text-base font-bold text-primary tabular-nums">
                    {plural(dayDetailsQuery.data.totals.totalPlays, "play")}
                  </p>
                </div>
                {dayDetailsQuery.data.topTracks.length ? (
                  <ol className="space-y-1">
                    {dayDetailsQuery.data.topTracks.slice(0, 3).map((track, index) => (
                      <li key={`${track.trackName}-${index}`}>
                        <Link
                          to="/top-tracks/$trackName"
                          params={{ trackName: encodeURIComponent(track.trackName) }}
                          search={{ artist: track.artistName, trackId: undefined }}
                          className="group -mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/60"
                        >
                          <span className="w-5 text-sm font-bold text-primary tabular-nums">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium transition-colors group-hover:text-primary">
                              {track.trackName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {track.artistName}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                            {plural(track.plays, "play")}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">No plays on this day.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No plays yet.</p>
            )}
          </Panel>
        </div>
      </div>

      {/* Hourly distribution + recent history */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="When you listen"
          description={
            peak !== null
              ? `Plays by hour of day · busiest around ${formatHourLong(peak)}`
              : "Plays by hour of day"
          }
        >
          {loading ? (
            <Skeleton className="h-[220px] w-full sm:h-[260px]" />
          ) : (
            <HourChart data={byHour} />
          )}
        </Panel>

        <Panel
          title="Recent history"
          description="Latest tracked listens"
          action={<PanelLink to="/recent">View all</PanelLink>}
        >
          {recentQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : recent.length ? (
            <ul className="-mx-2 space-y-0.5">
              {recent.slice(0, 6).map(item => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconMusic className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.trackName}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.artistName}</p>
                  </div>
                  <p className="shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                    {formatTime(item.playedAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          )}
        </Panel>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  description,
  icon,
  loading,
}: {
  label: string
  value: string
  description: string
  icon: React.ReactNode
  loading?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <Eyebrow className="truncate text-primary">{label}</Eyebrow>
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-3 h-8 w-20" />
          <Skeleton className="mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
            {value}
          </p>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">{description}</p>
        </>
      )}
    </div>
  )
}
