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
import { EmptyState, ErrorNotice, PageHeader } from '@/components/page'
import { statsRangeLabel } from '@/lib/stats-range'

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
    <div className="space-y-8 lg:space-y-10">
      <PageHeader
        title="Top tracks"
        description={
          range === 'all'
            ? 'Your most played songs of all time'
            : `Your most played songs · ${statsRangeLabel(range)}`
        }
        actions={<StatsRangeSelector value={range} onChange={setRange} />}
      />

      <ErrorNotice
        message={
          tracksQuery.error instanceof Error ? tracksQuery.error.message : null
        }
      />

      {tracksQuery.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : tracks.length ? (
        <section>
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10 sm:w-12">#</th>
                <th>Track</th>
                <th className="hidden w-[28%] md:table-cell">Artist</th>
                <th className="w-16 text-right sm:w-20">Plays</th>
                <th className="hidden w-24 text-right sm:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((track, index) => (
                <tr
                  key={`${track.trackId || track.trackName}-${index}`}
                  className="group"
                >
                  <td className="text-sm font-medium text-muted-foreground tabular-nums">
                    {index + 1}
                  </td>
                  <td>
                    <Link
                      to="/top-tracks/$trackName"
                      params={{
                        trackName: encodeURIComponent(track.trackName),
                      }}
                      search={{
                        artist: track.artistName,
                        trackId: track.trackId ?? undefined,
                      }}
                      className="flex min-w-0 flex-col gap-0.5"
                    >
                      <span className="truncate text-[15px] leading-snug font-medium">
                        {track.trackName}
                      </span>
                      <span className="truncate text-[13px] leading-snug text-muted-foreground md:hidden">
                        {track.artistName}
                      </span>
                    </Link>
                  </td>
                  <td className="hidden md:table-cell">
                    <Link
                      to="/top-artists/$artistName"
                      params={{
                        artistName: encodeURIComponent(track.artistName),
                      }}
                      className="block truncate text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {track.artistName}
                    </Link>
                  </td>
                  <td className="text-right text-sm font-semibold tabular-nums">
                    {track.plays}
                  </td>
                  <td className="hidden text-right text-sm whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">
                    {formatDurationShort(Number(track.totalMsPlayed))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tracks.length > INITIAL_ROWS ? (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? 'Show top 20' : `Show all ${tracks.length}`}
              </Button>
            </div>
          ) : null}
        </section>
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
