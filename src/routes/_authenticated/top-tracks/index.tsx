import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconMusic } from '@tabler/icons-react'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDurationShort } from '@/lib/spotify-client'
import { topTracksQueryOptions } from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'
import { EmptyState, ErrorNotice, PageHeader, Panel } from '@/components/page'
import { statsRangeLabel } from '@/lib/stats-range'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/top-tracks/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topTracksQueryOptions('30d')),
  component: TopTracksPage,
})

const INITIAL_ROWS = 20

function TopTracksPage() {
  const [range, setRange] = useState<StatsRange>('30d')
  const [showAll, setShowAll] = useState(false)

  const tracksQuery = useQuery(topTracksQueryOptions(range))
  const tracks = tracksQuery.data?.items ?? []
  const visible = showAll ? tracks : tracks.slice(0, INITIAL_ROWS)

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Top Tracks"
        description={
          range === 'all'
            ? 'Your most played songs of all time'
            : `Your most played songs · ${statsRangeLabel(range)}`
        }
        actions={<StatsRangeSelector value={range} onChange={setRange} />}
      />

      <ErrorNotice
        message={tracksQuery.error instanceof Error ? tracksQuery.error.message : null}
      />

      {tracksQuery.isPending ? (
        <Panel>
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Panel>
      ) : tracks.length ? (
        <Panel flush className="overflow-hidden">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium tracking-[0.06em] text-muted-foreground uppercase">
                <th className="w-12 py-3.5 pl-5 sm:w-14 sm:pl-6">#</th>
                <th className="px-3 py-3.5">Track</th>
                <th className="hidden w-[28%] px-3 py-3.5 md:table-cell">Artist</th>
                <th className="w-16 px-3 py-3.5 text-right sm:w-20">Plays</th>
                <th className="hidden w-24 py-3.5 pr-6 pl-3 text-right sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((track, index) => {
                const first = index === 0
                return (
                  <tr
                    key={`${track.trackId || track.trackName}-${index}`}
                    className={cn(
                      'group border-b border-border transition-colors last:border-0 hover:bg-muted/50',
                      first && 'bg-gradient-to-r from-primary/[0.08] to-transparent',
                    )}
                  >
                    <td
                      className={cn(
                        'py-3 pl-5 text-sm font-semibold tabular-nums sm:pl-6',
                        first ? 'font-bold text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        to="/top-tracks/$trackName"
                        params={{ trackName: encodeURIComponent(track.trackName) }}
                        search={{ artist: track.artistName, trackId: track.trackId ?? undefined }}
                        className="flex min-w-0 items-center gap-3 sm:gap-4"
                      >
                        <div
                          className={cn(
                            'flex size-10 shrink-0 items-center justify-center rounded-md',
                            first ? 'bg-primary/15' : 'bg-muted',
                          )}
                        >
                          <IconMusic
                            className={cn('size-4', first ? 'text-primary' : 'text-muted-foreground')}
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'truncate text-[15px] transition-colors group-hover:text-primary',
                              first ? 'font-semibold' : 'font-medium',
                            )}
                          >
                            {track.trackName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground md:hidden">
                            {track.artistName}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <Link
                        to="/top-artists/$artistName"
                        params={{ artistName: encodeURIComponent(track.artistName) }}
                        className="block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {track.artistName}
                      </Link>
                    </td>
                    <td
                      className={cn(
                        'px-3 py-3 text-right text-sm font-semibold tabular-nums',
                        first && 'text-primary',
                      )}
                    >
                      {track.plays}
                    </td>
                    <td className="hidden py-3 pr-6 pl-3 text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                      {formatDurationShort(Number(track.totalMsPlayed))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {tracks.length > INITIAL_ROWS ? (
            <div className="border-t border-border p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setShowAll(value => !value)}>
                {showAll ? 'Show top 20' : `Show all ${tracks.length}`}
              </Button>
            </div>
          ) : null}
        </Panel>
      ) : (
        <EmptyState
          icon={<IconMusic className="size-5" />}
          title="No tracks in this range"
          description="Try a longer time range, or sync your recent plays from Spotify."
        />
      )}
    </div>
  )
}
