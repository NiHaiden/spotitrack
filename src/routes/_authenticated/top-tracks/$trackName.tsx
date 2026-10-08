import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconMusic } from '@tabler/icons-react'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDurationShort } from '@/lib/spotify-client'
import {
  trackDetailQueryOptions,
  topTracksQueryOptions,
} from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'
import { HourChart, TrendChart, fillDayGaps, peakHour } from '@/components/charts'
import {
  Breadcrumbs,
  DetailHero,
  DetailRow,
  DetailRows,
  EmptyState,
  ErrorNotice,
  Panel,
  PanelLink,
  SourceBadge,
} from '@/components/page'
import {
  formatDayShort,
  formatHourLong,
  formatRelativeDay,
  formatTime,
} from '@/lib/format'
import { statsRangeLabel, statsRangeStart } from '@/lib/stats-range'

export const Route = createFileRoute('/_authenticated/top-tracks/$trackName')({
  validateSearch: (search: Record<string, unknown>) => ({
    artist: typeof search.artist === 'string' ? search.artist : undefined,
    trackId: typeof search.trackId === 'string' ? search.trackId : undefined,
  }),
  component: TrackDetailPage,
})

function TrackDetailPage() {
  const { trackName: rawTrackName } = Route.useParams()
  const { artist, trackId } = Route.useSearch()
  const trackName = decodeURIComponent(rawTrackName)
  const artistName = artist ? decodeURIComponent(artist) : undefined
  const [range, setRange] = useState<StatsRange>('30d')

  const tracksQuery = useQuery(topTracksQueryOptions(range))
  const tracks = tracksQuery.data?.items ?? []
  const matches = (t: (typeof tracks)[number]) =>
    t.trackName === trackName && (!artistName || t.artistName === artistName)
  const trackData = tracks.find(matches)
  const rank = tracks.findIndex(matches) + 1

  const detailQuery = useQuery(
    trackDetailQueryOptions(range, {
      trackId: trackId ?? trackData?.trackId ?? null,
      trackName,
      artistName: artistName ?? trackData?.artistName ?? null,
    }),
  )
  const detail = detailQuery.data

  const timeline = useMemo(
    () =>
      fillDayGaps(
        (detail?.byDay ?? []).map(d => ({ day: d.day, value: Number(d.plays) })),
        day => ({ day, value: 0 }),
        { from: range === 'all' ? undefined : statsRangeStart(range), to: new Date() },
      ),
    [detail, range],
  )

  const totalPlays = Number(detail?.totals.totalPlays ?? 0)
  const totalMs = Number(detail?.totals.totalMsPlayed ?? 0)
  const activeDays = detail?.byDay.length ?? 0
  const peakDay = detail?.byDay.length
    ? detail.byDay.reduce((a, b) => (Number(a.plays) >= Number(b.plays) ? a : b))
    : null
  const busiestHour = detail ? peakHour(detail.byHour) : null
  const allPlays = tracks.reduce((sum, t) => sum + Number(t.plays), 0)
  const resolvedArtist = artistName ?? trackData?.artistName

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs parent={{ label: 'Top Tracks', to: '/top-tracks' }} current={trackName} />
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      <DetailHero
        art={
          <div className="flex size-full items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/60 to-primary/20 shadow-lg">
            <IconMusic className="size-9 text-primary-foreground/70 sm:size-12" />
          </div>
        }
        eyebrow={`${rank > 0 ? `#${rank} track · ` : ''}${statsRangeLabel(range)}`}
        title={trackName}
        subtitle={
          resolvedArtist ? (
            <Link
              to="/top-artists/$artistName"
              params={{ artistName: encodeURIComponent(resolvedArtist) }}
              className="transition-colors hover:text-primary"
            >
              {resolvedArtist}
            </Link>
          ) : undefined
        }
        stats={
          detail
            ? [
                { label: 'Plays', value: totalPlays.toLocaleString() },
                { label: 'Listened', value: formatDurationShort(totalMs) },
                {
                  label: 'Avg. listen',
                  value: totalPlays ? formatDurationShort(totalMs / totalPlays) : '—',
                },
              ]
            : undefined
        }
      />

      <ErrorNotice message={detailQuery.error instanceof Error ? detailQuery.error.message : null} />

      {detailQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-[340px] w-full rounded-2xl" />
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        </div>
      ) : detail && totalPlays ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Panel title="Play frequency" description={`Times played per day · ${statsRangeLabel(range)}`}>
              <TrendChart data={timeline} label="Plays" />
            </Panel>

            <Panel title="Track details">
              <DetailRows>
                <DetailRow
                  label="Avg. plays / active day"
                  value={(totalPlays / Math.max(activeDays, 1)).toFixed(1)}
                />
                <DetailRow
                  label="Peak day"
                  value={peakDay ? `${formatDayShort(peakDay.day)} · ${peakDay.plays}` : '—'}
                  accent
                />
                <DetailRow
                  label="Usually played"
                  value={busiestHour !== null ? `~${formatHourLong(busiestHour)}` : '—'}
                />
                <DetailRow
                  label="First played"
                  value={detail.byDay.length ? formatDayShort(detail.byDay[0].day) : '—'}
                />
                <DetailRow
                  label="Last played"
                  value={detail.recent.length ? formatRelativeDay(new Date(detail.recent[0].playedAt)) : '—'}
                />
                <DetailRow
                  label="Share of all plays"
                  value={allPlays ? `${((totalPlays / allPlays) * 100).toFixed(1)}%` : '—'}
                />
              </DetailRows>
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel
              title="When you play this track"
              description={
                busiestHour !== null
                  ? `Plays by hour of day · mostly around ${formatHourLong(busiestHour)}`
                  : 'Plays by hour of day'
              }
            >
              <HourChart data={detail.byHour} />
            </Panel>

            <Panel title="Recent plays" action={<PanelLink to="/recent">View all</PanelLink>}>
              {detail.recent.length ? (
                <ul className="divide-y divide-border">
                  {detail.recent.slice(0, 8).map(item => {
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{formatRelativeDay(new Date(item.playedAt))}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{formatTime(item.playedAt)}</p>
                        </div>
                        <SourceBadge source={item.source} />
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No recent plays found.</p>
              )}
            </Panel>
          </div>
        </div>
      ) : detail ? (
        <EmptyState
          icon={<IconMusic className="size-5" />}
          title="No plays of this track in this range"
          description="Try a longer time range."
        />
      ) : null}
    </div>
  )
}
