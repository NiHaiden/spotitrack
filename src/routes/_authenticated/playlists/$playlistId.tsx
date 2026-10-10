import { createFileRoute } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconMusic, IconPlaylist } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDurationShort } from '@/lib/spotify-client'
import { playlistInsightsQueryOptions } from '@/lib/spotify-query-options'
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
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/playlists/$playlistId')({
  component: PlaylistDetailPage,
})

function PlaylistDetailPage() {
  const { playlistId } = Route.useParams()

  const insightsQuery = useQuery(playlistInsightsQueryOptions(playlistId))
  const data = insightsQuery.data

  const byDay = data?.tracked.byDay ?? []
  const timeline = useMemo(
    () =>
      fillDayGaps(
        byDay.map(d => ({ day: d.day, value: Number(d.plays) })),
        day => ({ day, value: 0 }),
        { to: new Date() },
      ),
    [byDay],
  )

  const topTrackData = (data?.tracked.topTracks ?? []).slice(0, 15)
  const totalPlays = Number(data?.tracked.totals.totalPlays ?? 0)
  const totalMs = Number(data?.tracked.totals.totalMsPlayed ?? 0)
  const peak = byDay.length
    ? byDay.reduce((a, b) => (Number(a.plays) >= Number(b.plays) ? a : b))
    : null
  const coverage = data?.coverage.totalTracks
    ? Math.round((data.coverage.trackedTracks / data.coverage.totalTracks) * 100)
    : null

  return (
    <div className="space-y-4 lg:space-y-5">
      <Breadcrumbs
        parent={{ label: 'Playlists', to: '/playlists' }}
        current={data?.playlist.name ?? 'Loading…'}
      />

      {insightsQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-[20px]" />
          <Skeleton className="h-[340px] w-full rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <DetailHero
            art={
              <div className="size-full overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/60 to-primary/20 shadow-lg">
                {data.playlist.imageUrl ? (
                  <img src={data.playlist.imageUrl} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <IconPlaylist className="size-9 text-primary-foreground/70 sm:size-12" />
                  </div>
                )}
              </div>
            }
            eyebrow={`Playlist · ${plural(data.playlist.trackCount, 'track')}`}
            title={data.playlist.name}
            subtitle={`by ${data.playlist.ownerName}`}
            stats={[
              { label: 'Plays', value: totalPlays.toLocaleString() },
              { label: 'Listened', value: formatDurationShort(totalMs) },
              { label: 'Tracks played', value: data.coverage.trackedTracks },
            ]}
          />

          {totalPlays ? (
            <>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <Panel
                  title="Plays over time"
                  description="Daily plays of tracks from this playlist"
                >
                  <TrendChart data={timeline} label="Plays" />
                </Panel>

                <Panel title="Playlist stats">
                  <DetailRows>
                    <DetailRow
                      label="Avg. plays / active day"
                      value={(totalPlays / Math.max(byDay.length, 1)).toFixed(1)}
                    />
                    <DetailRow
                      label="Avg. time / active day"
                      value={formatDurationShort(totalMs / Math.max(byDay.length, 1))}
                    />
                    <DetailRow label="Days listened" value={byDay.length} />
                    <DetailRow
                      label="Peak day"
                      value={peak ? `${formatDayShort(peak.day)} · ${peak.plays}` : '—'}
                      accent
                    />
                    <DetailRow
                      label="Tracks you've played"
                      value={
                        coverage !== null
                          ? `${data.coverage.trackedTracks}/${data.coverage.totalTracks} · ${coverage}%`
                          : '—'
                      }
                      accent
                    />
                  </DetailRows>
                </Panel>
              </div>

              {topTrackData.length ? (
                <Panel title="Most played from this playlist" flush className="overflow-hidden">
                  <table className="w-full table-fixed">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                        <th className="w-12 py-3.5 pl-5 sm:w-14 sm:pl-6">#</th>
                        <th className="px-3 py-3.5">Track</th>
                        <th className="hidden w-[24%] px-3 py-3.5 md:table-cell">Artist</th>
                        <th className="w-16 px-3 py-3.5 text-right sm:w-20">Plays</th>
                        <th className="hidden w-24 px-3 py-3.5 text-right sm:table-cell">Time</th>
                        <th className="hidden w-36 py-3.5 pr-6 pl-3 text-right lg:table-cell">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTrackData.map((track, index) => {
                        const share = totalPlays ? (Number(track.plays) / totalPlays) * 100 : 0
                        const first = index === 0
                        return (
                          <tr
                            key={`${track.trackId || track.trackName}-${index}`}
                            className={cn(
                              'border-b border-border transition-colors last:border-0 hover:bg-muted/50',
                              first && 'bg-gradient-to-r from-primary/[0.08] to-transparent',
                            )}
                          >
                            <td className={cn('py-3 pl-5 text-sm font-semibold tabular-nums sm:pl-6', first ? 'text-primary' : 'text-muted-foreground')}>
                              {index + 1}
                            </td>
                            <td className="px-3 py-3">
                              <p className="truncate text-[15px] font-medium">{track.trackName}</p>
                              <p className="truncate text-xs text-muted-foreground md:hidden">{track.artistName}</p>
                            </td>
                            <td className="hidden truncate px-3 py-3 text-sm text-muted-foreground md:table-cell">
                              {track.artistName}
                            </td>
                            <td className={cn('px-3 py-3 text-right text-sm font-semibold tabular-nums', first && 'text-primary')}>
                              {track.plays}
                            </td>
                            <td className="hidden px-3 py-3 text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                              {formatDurationShort(Number(track.totalMsPlayed))}
                            </td>
                            <td className="hidden py-3 pr-6 pl-3 lg:table-cell">
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
          ) : (
            <EmptyState
              icon={<IconMusic className="size-5" />}
              title="No tracked plays from this playlist yet"
              description="Once you listen to tracks from this playlist, they'll show up here."
            />
          )}
        </>
      ) : (
        <ErrorNotice
          message={insightsQuery.error instanceof Error ? insightsQuery.error.message : 'Failed to load playlist.'}
        />
      )}
    </div>
  )
}
