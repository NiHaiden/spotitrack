import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDurationShort } from "@/lib/spotify-client"
import { StatsRange, statsRangeLabel } from "@/lib/stats-range"
import { topArtistsQueryOptions } from "@/lib/spotify-query-options"
import { StatsRangeSelector } from "@/components/stats-range-selector"

export const Route = createFileRoute("/_authenticated/top-artists")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topArtistsQueryOptions("30d")),
  component: TopArtistsPage,
})

function TopArtistsPage() {
  const [range, setRange] = useState<StatsRange>("30d")
  const artistsQuery = useQuery(topArtistsQueryOptions(range))

  const artists = artistsQuery.data?.items ?? []

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Top Artists</h2>
          <p className="text-muted-foreground">
            The artists you listen to most in tracked history.
          </p>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {artistsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{artistsQuery.error.message}</p>
      ) : null}

      <p className="text-sm text-muted-foreground">{statsRangeLabel(range)}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {artistsQuery.isPending
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-16 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          : artists.map((artist, i) => (
              <Card key={`${artist.artistName}-${i}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-16">
                      <AvatarImage src={artist.imageUrl ?? undefined} alt={artist.artistName} />
                      <AvatarFallback>
                        {artist.artistName
                          .split(" ")
                          .map(part => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate text-sm font-semibold">
                        #{i + 1} {artist.artistName}
                      </p>
                      <p className="text-xs text-muted-foreground">{artist.plays} plays</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDurationShort(artist.totalMsPlayed)} listened
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!artistsQuery.isPending && !artists.length ? (
        <p className="text-sm text-muted-foreground">
          No artists tracked yet. Sync recent plays or import Spotify history.
        </p>
      ) : null}
    </div>
  )
}
