import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDurationShort } from "@/lib/spotify-client"
import { StatsRange, statsRangeLabel } from "@/lib/stats-range"
import { topTracksQueryOptions } from "@/lib/spotify-query-options"
import { StatsRangeSelector } from "@/components/stats-range-selector"

export const Route = createFileRoute("/_authenticated/top-tracks")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topTracksQueryOptions("30d")),
  component: TopTracksPage,
})

function TopTracksPage() {
  const [range, setRange] = useState<StatsRange>("30d")
  const tracksQuery = useQuery(topTracksQueryOptions(range))

  const tracks = tracksQuery.data?.items ?? []

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Top Tracks</h2>
          <p className="text-muted-foreground">
            Your most played songs from tracked listening history.
          </p>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {tracksQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{tracksQuery.error.message}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{statsRangeLabel(range)} Favorites</CardTitle>
          <CardDescription>Sorted by plays then listening time.</CardDescription>
        </CardHeader>
        <CardContent>
          {tracksQuery.isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-md border p-3"
                >
                  <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          ) : tracks.length ? (
            <div className="space-y-3">
              {tracks.map((track, i) => (
                <div
                  key={`${track.trackId ?? track.trackName}-${i}`}
                  className="flex items-center gap-4 rounded-md border p-3"
                >
                  <span className="w-6 text-center text-sm font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{track.trackName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {track.artistName}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{track.plays} plays</p>
                    <p>{formatDurationShort(track.totalMsPlayed)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No tracked songs yet. Open Recent and run a sync/import first.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
