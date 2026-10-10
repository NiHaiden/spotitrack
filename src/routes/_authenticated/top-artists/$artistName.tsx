import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDurationShort } from '@/lib/spotify-client'
import {
  artistDetailQueryOptions,
  topArtistsQueryOptions,
} from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'
import { TrendChart, fillDayGaps } from '@/components/charts'
import {
  Breadcrumbs,
  DetailHero,
  DetailRow,
  DetailRows,
  EmptyState,
  ErrorNotice,
  Panel,
  ShareBar,
} from '@/components/page'
import { formatDayShort, plural } from '@/lib/format'
import { statsRangeLabel, statsRangeStart } from '@/lib/stats-range'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/top-artists/$artistName')({
  component: ArtistDetailPage,
})

function ArtistDetailPage() {
  const { artistName: rawArtistName } = Route.useParams()
  const artistName = decodeURIComponent(rawArtistName)
  const [range, setRange] = useState<StatsRange>('30d')

  const artistsQuery = useQuery(topArtistsQueryOptions(range))
  const artists = artistsQuery.data?.items ?? []
  const artistData = artists.find(a => a.artistName === artistName)
  const rank = artists.findIndex(a => a.artistName === artistName) + 1

  const detailQuery = useQuery(artistDetailQueryOptions(range, artistName))
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

  const activeDays = detail?.byDay.length ?? 0
  const peak = detail?.byDay.length
    ? detail.byDay.reduce((a, b) => (Number(a.plays) >= Number(b.plays) ? a : b))
    : null
  const allPlays = artists.reduce((sum, a) => sum + Number(a.plays), 0)

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Breadcrumbs parent={{ label: 'Top Artists', to: '/top-artists' }} current={artistName} />
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      <DetailHero
        art={
          <Avatar className="size-full shadow-lg ring-4 ring-background">
            <AvatarImage src={artistData?.imageUrl || undefined} alt={artistName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-4xl font-bold text-primary-foreground sm:text-5xl">
              {artistName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        }
        eyebrow={`${rank > 0 ? `#${rank} artist · ` : ''}${statsRangeLabel(range)}`}
        title={artistName}
        subtitle={detail ? `${plural(Number(detail.totals.uniqueTracks), 'track')} played` : undefined}
        stats={
          detail
            ? [
                { label: 'Plays', value: Number(detail.totals.totalPlays).toLocaleString() },
                { label: 'Listened', value: formatDurationShort(Number(detail.totals.totalMsPlayed)) },
                { label: 'Tracks', value: detail.totals.uniqueTracks },
              ]
            : undefined
        }
      />

      <ErrorNotice message={detailQuery.error instanceof Error ? detailQuery.error.message : null} />

      {detailQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-[340px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      ) : detail && detail.totals.totalPlays ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <Panel
              title="Plays over time"
              description={`Daily plays of ${artistName} · ${statsRangeLabel(range)}`}
            >
              <TrendChart data={timeline} label="Plays" />
            </Panel>

            <Panel title="Listening breakdown">
              <DetailRows>
                <DetailRow
                  label="Avg. plays / active day"
                  value={(Number(detail.totals.totalPlays) / Math.max(activeDays, 1)).toFixed(1)}
                />
                <DetailRow
                  label="Avg. time / active day"
                  value={formatDurationShort(Number(detail.totals.totalMsPlayed) / Math.max(activeDays, 1))}
                />
                <DetailRow label="Days listened" value={activeDays} />
                <DetailRow
                  label="Peak day"
                  value={peak ? `${formatDayShort(peak.day)} · ${peak.plays}` : '—'}
                  accent
                />
                <DetailRow
                  label="First listened"
                  value={detail.byDay.length ? formatDayShort(detail.byDay[0].day) : '—'}
                />
                <DetailRow
                  label="Share of listening"
                  value={
                    allPlays
                      ? `${((Number(detail.totals.totalPlays) / allPlays) * 100).toFixed(1)}%`
                      : '—'
                  }
                />
              </DetailRows>
            </Panel>
          </div>

          {detail.topTracks.length ? (
            <Panel title={`Top tracks by ${artistName}`} flush className="overflow-hidden">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                    <th className="w-12 py-3.5 pl-5 sm:w-14 sm:pl-6">#</th>
                    <th className="px-3 py-3.5">Track</th>
                    <th className="w-16 px-3 py-3.5 text-right sm:w-20">Plays</th>
                    <th className="hidden w-24 px-3 py-3.5 text-right sm:table-cell">Time</th>
                    <th className="hidden w-36 py-3.5 pr-6 pl-3 text-right md:table-cell">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.topTracks.map((track, index) => {
                    const total = Number(detail.totals.totalPlays)
                    const share = total ? (Number(track.plays) / total) * 100 : 0
                    const first = index === 0
                    return (
                      <tr
                        key={`${track.trackId || track.trackName}-${index}`}
                        className={cn(
                          'group border-b border-border transition-colors last:border-0 hover:bg-muted/50',
                          first && 'bg-gradient-to-r from-primary/[0.08] to-transparent',
                        )}
                      >
                        <td className={cn('py-3 pl-5 text-sm font-semibold tabular-nums sm:pl-6', first ? 'text-primary' : 'text-muted-foreground')}>
                          {index + 1}
                        </td>
                        <td className="px-3 py-3">
                          <Link
                            to="/top-tracks/$trackName"
                            params={{ trackName: encodeURIComponent(track.trackName) }}
                            search={{ artist: artistName, trackId: track.trackId ?? undefined }}
                            className="block truncate text-[15px] font-medium transition-colors group-hover:text-primary"
                          >
                            {track.trackName}
                          </Link>
                        </td>
                        <td className={cn('px-3 py-3 text-right text-sm font-semibold tabular-nums', first && 'text-primary')}>
                          {track.plays}
                        </td>
                        <td className="hidden px-3 py-3 text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                          {formatDurationShort(Number(track.totalMsPlayed))}
                        </td>
                        <td className="hidden py-3 pr-6 pl-3 md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <ShareBar percent={share} />
                            <span className="w-11 text-right text-xs text-muted-foreground tabular-nums">
                              {share.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Panel>
          ) : null}
        </>
      ) : detail ? (
        <EmptyState
          title={`No plays of ${artistName} in this range`}
          description="Try a longer time range."
        />
      ) : null}
    </div>
  )
}
