import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { IconMusic } from '@tabler/icons-react'
import { formatDurationShort } from '@/lib/spotify-client'
import { topTracksQueryOptions } from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'

export const Route = createFileRoute('/_authenticated/top-tracks/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topTracksQueryOptions('30d')),
  component: TopTracksPage,
})

function TopTracksPage() {
  const [range, setRange] = useState<StatsRange>('30d')

  const tracksQuery = useQuery(topTracksQueryOptions(range))
  const tracks = tracksQuery.data?.items ?? []

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[34px]">Top Tracks</h1>
          <p className="text-sm text-muted-foreground">
            Your most played songs across all time
          </p>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {tracksQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{tracksQuery.error.message}</p>
      ) : null}

      {/* Track table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {tracksQuery.isPending ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : tracks.length ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/50">
                <th className="px-6 py-4 w-12">#</th>
                <th className="px-4 py-4">TRACK</th>
                <th className="px-4 py-4 hidden md:table-cell w-40">ARTIST</th>
                <th className="px-4 py-4 text-right w-20">PLAYS</th>
                <th className="px-6 py-4 text-right hidden sm:table-cell w-20">TIME</th>
              </tr>
            </thead>
            <tbody>
              {tracks.slice(0, 20).map((track, index) => (
                <tr
                  key={`${track.trackId || track.trackName}-${index}`}
                  className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${
                    index === 0 ? 'bg-gradient-to-r from-primary/[0.08] to-transparent' : ''
                  }`}
                >
                  <td className={`px-6 py-3.5 text-sm tabular-nums font-semibold ${
                    index === 0 ? 'text-primary font-bold' : 'text-muted-foreground'
                  }`}>
                    {index + 1}
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      to="/top-tracks/$trackName"
                      params={{ trackName: encodeURIComponent(track.trackName) }}
                      search={{ artist: track.artistName, trackId: track.trackId ?? undefined }}
                      className="flex items-center gap-4 group"
                    >
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-md ${
                        index === 0 ? 'bg-gradient-to-br from-[oklch(0.25_0.01_55)] to-[oklch(0.23_0_0)]' : 'bg-muted'
                      }`}>
                        <IconMusic className={`size-4 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <span className={`truncate text-[15px] group-hover:text-primary transition-colors ${
                        index === 0 ? 'font-semibold' : 'font-medium'
                      }`}>
                        {track.trackName}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-muted-foreground hidden md:table-cell w-40">
                    {track.artistName}
                  </td>
                  <td className="px-4 py-3.5 text-right w-20">
                    <span className={`text-sm font-semibold tabular-nums ${
                      index === 0 ? 'text-primary' : 'text-foreground'
                    }`}>
                      {track.plays}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right text-sm text-muted-foreground hidden sm:table-cell w-20">
                    {formatDurationShort(track.totalMsPlayed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-muted-foreground">No track data yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
