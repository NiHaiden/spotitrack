import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconClock } from '@tabler/icons-react'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatsRangeSelector } from '@/components/stats-range-selector'
import { BackgroundSyncStatus } from '@/components/background-sync-status'
import {
  HourChart,
  TrendChart,
  fillDayGaps,
  formatMinutesTick,
  peakHour,
} from '@/components/charts'
import {
  EmptyState,
  ErrorNotice,
  PageHeader,
  Panel,
  PanelLink,
} from '@/components/page'
import { Roll } from '@/components/stageshow/kit/motion/Roll'
import { formatDurationShort } from '@/lib/spotify-client'
import {
  formatDayLong,
  formatHourLong,
  formatRelativeDay,
  formatTime,
  plural,
} from '@/lib/format'
import {
  dayStatsQueryOptions,
  recentQueryOptions,
  statsOverviewQueryOptions,
} from '@/lib/spotify-query-options'
import { statsRangeLabel, statsRangeStart } from '@/lib/stats-range'

export const Route = createFileRoute('/_authenticated/dashboard')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(statsOverviewQueryOptions('30d')),
      context.queryClient.ensureQueryData(recentQueryOptions(25)),
    ]),
  component: DashboardPage,
})

function DashboardPage() {
  const { user } = Route.useRouteContext()
  const [range, setRange] = useState<StatsRange>('30d')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [hoverDay, setHoverDay] = useState<string | null>(null)

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
        byDay.map((item) => ({
          day: item.day,
          value: Math.round(Number(item.totalMsPlayed) / 60_000),
        })),
        (day) => ({ day, value: 0 }),
        {
          from: range === 'all' ? undefined : statsRangeStart(range),
          to: new Date(),
        },
      ),
    [byDay, range],
  )

  const lastDay = byDay[byDay.length - 1]?.day ?? null
  const activeDay = selectedDay ?? lastDay
  const dayDetailsQuery = useQuery(dayStatsQueryOptions(activeDay, 5))

  const activeDayLabel = activeDay
    ? formatRelativeDay(new Date(`${activeDay}T12:00:00`))
    : null

  const topArtist = topArtists[0]
  const firstName = user.name.split(' ')[0] || 'there'
  const peak = peakHour(byHour)

  // The headline is the chart's readout: the day under the pointer, else the
  // day picked, else the whole range.
  const readDay = hoverDay ?? selectedDay
  const readMinutes = readDay
    ? (listeningTimeline.find((item) => item.day === readDay)?.value ?? 0)
    : null
  const totalMs = Number(totals?.totalMsPlayed ?? 0)

  return (
    <div className="space-y-8 lg:space-y-10">
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

      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The leading object: time listened, read off the chart under it */}
        <Panel surface>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] text-muted-foreground">
                {loading ? (
                  'Time listened'
                ) : (
                  <Roll variant="fade">
                    {readDay
                      ? formatDayLong(readDay)
                      : `Time listened · ${statsRangeLabel(range)}`}
                  </Roll>
                )}
              </span>
              {loading ? (
                <Skeleton className="h-11 w-40" />
              ) : (
                <span className="text-4xl leading-tight font-bold tracking-[-0.03em] tabular-nums sm:text-[44px]">
                  <Roll stagger={25}>
                    {formatDurationShort(
                      readMinutes === null ? totalMs : readMinutes * 60_000,
                    )}
                  </Roll>
                </span>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-6 sm:flex sm:gap-8">
              <Stat
                label="Plays"
                loading={loading}
                value={(totals?.totalPlays ?? 0).toLocaleString()}
              />
              <Stat
                label="Artists"
                loading={loading}
                value={Number(totals?.uniqueArtists ?? 0).toLocaleString()}
              />
              <Stat
                label="Unique tracks"
                loading={loading}
                value={Number(totals?.uniqueTracks ?? 0).toLocaleString()}
              />
            </dl>
          </div>

          <p className="mt-6 mb-3 text-[13px] text-muted-foreground">
            Time per day · {statsRangeLabel(range)} · click a day for its top
            tracks
          </p>
          {loading ? (
            <Skeleton className="h-[260px] w-full sm:h-[300px]" />
          ) : listeningTimeline.length ? (
            <TrendChart
              data={listeningTimeline}
              label="Listened"
              valueFormatter={(minutes) =>
                formatDurationShort(minutes * 60_000)
              }
              yTickFormatter={formatMinutesTick}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onHoverDay={setHoverDay}
            />
          ) : (
            <EmptyState
              icon={<IconClock className="size-5" />}
              title="No listening data yet"
              description="Plays show up here once SpotiTrack has synced with Spotify."
            />
          )}
        </Panel>

        <div className="flex min-w-0 flex-col gap-10">
          <Panel
            title="Top artist"
            action={<PanelLink to="/top-artists">View all</PanelLink>}
          >
            {loading ? (
              <Skeleton className="h-14 w-full" />
            ) : topArtist ? (
              <Link
                to="/top-artists/$artistName"
                params={{
                  artistName: encodeURIComponent(topArtist.artistName),
                }}
                className="group -mx-3 flex items-center gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-muted/70"
              >
                <Avatar className="size-14">
                  <AvatarImage
                    src={topArtist.imageUrl ?? undefined}
                    alt={topArtist.artistName}
                  />
                  <AvatarFallback className="bg-muted text-lg font-semibold text-muted-foreground">
                    {topArtist.artistName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-lg leading-snug font-semibold">
                    {topArtist.artistName}
                  </p>
                  <p className="text-[13px] text-muted-foreground tabular-nums">
                    {plural(topArtist.plays, 'play')} ·{' '}
                    {formatDurationShort(Number(topArtist.totalMsPlayed))}
                  </p>
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">
                No artist data yet.
              </p>
            )}
          </Panel>

          <Panel
            title={
              activeDayLabel ? `${activeDayLabel} · Top tracks` : 'Top tracks'
            }
            description={
              dayDetailsQuery.data
                ? `${formatDurationShort(Number(dayDetailsQuery.data.totals.totalMsPlayed))} listened · ${plural(dayDetailsQuery.data.totals.totalPlays, 'play')}`
                : undefined
            }
            action={
              selectedDay && selectedDay !== lastDay ? (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className="shrink-0 text-[13px] font-medium text-primary hover:text-primary/80"
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
              dayDetailsQuery.data.topTracks.length ? (
                <ol className="-mx-3">
                  {dayDetailsQuery.data.topTracks
                    .slice(0, 5)
                    .map((track, index) => (
                      <li key={`${track.trackName}-${index}`}>
                        <Link
                          to="/top-tracks/$trackName"
                          params={{
                            trackName: encodeURIComponent(track.trackName),
                          }}
                          search={{
                            artist: track.artistName,
                            trackId: undefined,
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/70"
                        >
                          <span className="w-4 text-[13px] font-medium text-muted-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <TrackLines
                            name={track.trackName}
                            artist={track.artistName}
                          />
                          <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                            {plural(track.plays, 'play')}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No plays on this day.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No plays yet.</p>
            )}
          </Panel>
        </div>

        <Panel
          title="When you listen"
          description={
            peak !== null
              ? `Plays by hour of day · busiest around ${formatHourLong(peak)}`
              : 'Plays by hour of day'
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
          action={<PanelLink to="/recent">View all</PanelLink>}
        >
          {recentQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : recent.length ? (
            <ul className="-mx-3">
              {recent.slice(0, 6).map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/70"
                >
                  <TrackLines name={item.trackName} artist={item.artistName} />
                  <span className="shrink-0 text-[13px] text-muted-foreground tabular-nums">
                    {formatTime(item.playedAt)}
                  </span>
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

/** A secondary figure beside the headline: a value over its label. */
function Stat({
  label,
  value,
  loading,
}: {
  label: string
  value: string
  loading?: boolean
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-0.5">
      <dt className="text-[13px] whitespace-nowrap text-muted-foreground">
        {label}
      </dt>
      <dd className="text-xl leading-tight font-semibold tracking-[-0.02em] tabular-nums">
        {loading ? <Skeleton className="h-6 w-12" /> : <Roll>{value}</Roll>}
      </dd>
    </div>
  )
}

/** A track name over its artist: one item, 4px apart. */
function TrackLines({ name, artist }: { name: string; artist: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <p className="truncate text-sm leading-snug font-medium">{name}</p>
      <p className="truncate text-[13px] leading-snug text-muted-foreground">
        {artist}
      </p>
    </div>
  )
}
