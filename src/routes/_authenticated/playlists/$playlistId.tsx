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
        byDay.map((d) => ({ day: d.day, value: Number(d.plays) })),
        (day) => ({ day, value: 0 }),
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
    ? Math.round(
        (data.coverage.trackedTracks / data.coverage.totalTracks) * 100,
      )
    : null

  return (
    <div className="space-y-8 lg:space-y-10">
      <Breadcrumbs
        parent={{ label: 'Playlists', to: '/playlists' }}
        current={data?.playlist.name ?? 'Loading…'}
      />

      {insightsQuery.isPending ? (
        <div className="space-y-10">
          <Skeleton className="h-48 w-full rounded-[20px]" />
          <Skeleton className="h-[340px] w-full rounded-2xl" />
        </div>
      ) : data ? (
        <>
          <DetailHero
            art={
              <div className="size-full overflow-hidden rounded-xl bg-muted shadow-md">
                {data.playlist.imageUrl ? (
                  <img
                    src={data.playlist.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <IconPlaylist className="size-9 text-muted-foreground/60 sm:size-12" />
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
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                      value={(totalPlays / Math.max(byDay.length, 1)).toFixed(
                        1,
                      )}
                    />
                    <DetailRow
                      label="Avg. time / active day"
                      value={formatDurationShort(
                        totalMs / Math.max(byDay.length, 1),
                      )}
                    />
                    <DetailRow label="Days listened" value={byDay.length} />
                    <DetailRow
                      label="Peak day"
                      value={
                        peak
                          ? `${formatDayShort(peak.day)} · ${peak.plays}`
                          : '—'
                      }
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
                <Panel title="Most played from this playlist">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-10 sm:w-12">#</th>
                        <th>Track</th>
                        <th className="hidden w-[24%] md:table-cell">Artist</th>
                        <th className="w-16 text-right sm:w-20">Plays</th>
                        <th className="hidden w-24 text-right sm:table-cell">
                          Time
                        </th>
                        <th className="hidden w-36 text-right lg:table-cell">
                          Share
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {topTrackData.map((track, index) => {
                        const share = totalPlays
                          ? (Number(track.plays) / totalPlays) * 100
                          : 0
                        return (
                          <tr
                            key={`${track.trackId || track.trackName}-${index}`}
                          >
                            <td className="text-sm font-medium text-muted-foreground tabular-nums">
                              {index + 1}
                            </td>
                            <td>
                              <p className="truncate text-[15px] leading-snug font-medium">
                                {track.trackName}
                              </p>
                              <p className="truncate text-[13px] leading-snug text-muted-foreground md:hidden">
                                {track.artistName}
                              </p>
                            </td>
                            <td className="hidden truncate text-sm text-muted-foreground md:table-cell">
                              {track.artistName}
                            </td>
                            <td className="text-right text-sm font-semibold tabular-nums">
                              {track.plays}
                            </td>
                            <td className="hidden text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                              {formatDurationShort(Number(track.totalMsPlayed))}
                            </td>
                            <td className="hidden lg:table-cell">
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
          message={
            insightsQuery.error instanceof Error
              ? insightsQuery.error.message
              : 'Failed to load playlist.'
          }
        />
      )}
    </div>
  )
}
