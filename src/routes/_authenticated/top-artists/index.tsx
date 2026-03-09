import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDurationShort } from '@/lib/spotify-client'
import { topArtistsQueryOptions } from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'

export const Route = createFileRoute('/_authenticated/top-artists/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topArtistsQueryOptions('30d')),
  component: TopArtistsPage,
})

function TopArtistsPage() {
  const [range, setRange] = useState<StatsRange>('30d')

  const artistsQuery = useQuery(topArtistsQueryOptions(range))
  const artists = artistsQuery.data?.items ?? []

  const topArtist = artists[0]
  const restArtists = artists.slice(1)

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[34px]">Top Artists</h1>
          <p className="text-sm text-muted-foreground">Artists you listen to the most</p>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {artistsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{artistsQuery.error.message}</p>
      ) : null}

      {/* #1 Artist Hero */}
      {artistsQuery.isPending ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : topArtist ? (
        <Link
          to="/top-artists/$artistName"
          params={{ artistName: encodeURIComponent(topArtist.artistName) }}
          className="block w-full rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-8 text-left transition-colors hover:border-primary/30"
        >
          <div className="flex items-center gap-8">
            <Avatar className="size-[140px] shrink-0">
              <AvatarImage src={topArtist.imageUrl || undefined} alt={topArtist.artistName} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-5xl font-bold">
                {topArtist.artistName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                #1 ARTIST
              </p>
              <h2 className="text-[32px] font-bold tracking-[-0.03em] leading-[40px]">{topArtist.artistName}</h2>
              <p className="text-sm text-muted-foreground">
                {topArtist.plays} songs listened · {formatDurationShort(topArtist.totalMsPlayed)} total
              </p>
            </div>
            <span className="hidden lg:block text-5xl font-bold leading-none text-foreground/[0.15] tabular-nums">
              01
            </span>
          </div>
        </Link>
      ) : null}

      {/* Rest of artists - card grid */}
      {artistsQuery.isPending ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      ) : restArtists.length ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {restArtists.slice(0, 12).map((artist, index) => {
            const rank = index + 2
            return (
              <Link
                key={`${artist.artistName}-${rank}`}
                to="/top-artists/$artistName"
                params={{ artistName: encodeURIComponent(artist.artistName) }}
                className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-5 pb-6 text-center transition-colors hover:border-primary/30"
              >
                <span className="self-start text-[13px] font-bold tabular-nums text-muted-foreground/40">
                  {String(rank).padStart(2, '0')}
                </span>
                <Avatar className="size-[140px] shrink-0">
                  <AvatarImage src={artist.imageUrl || undefined} alt={artist.artistName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-[oklch(0.18_0_0)] text-muted-foreground text-4xl font-bold">
                    {artist.artistName.slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1">
                  <p className="truncate text-base font-semibold group-hover:text-primary transition-colors">
                    {artist.artistName}
                  </p>
                  <p className="text-[13px] text-muted-foreground">
                    {artist.plays} plays · {formatDurationShort(artist.totalMsPlayed)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
