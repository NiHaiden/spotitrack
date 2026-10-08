import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { IconUsers } from '@tabler/icons-react'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDurationShort } from '@/lib/spotify-client'
import { topArtistsQueryOptions } from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'
import { EmptyState, ErrorNotice, Eyebrow, PageHeader } from '@/components/page'
import { plural } from '@/lib/format'
import { statsRangeLabel } from '@/lib/stats-range'

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
  const restArtists = artists.slice(1, 25)
  const totalPlays = artists.reduce((sum, a) => sum + Number(a.plays), 0)

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Top Artists"
        description={
          range === 'all'
            ? 'Artists you listen to the most, all time'
            : `Artists you listen to the most · ${statsRangeLabel(range)}`
        }
        actions={<StatsRangeSelector value={range} onChange={setRange} />}
      />

      <ErrorNotice
        message={artistsQuery.error instanceof Error ? artistsQuery.error.message : null}
      />

      {artistsQuery.isPending ? (
        <>
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
            ))}
          </div>
        </>
      ) : topArtist ? (
        <>
          {/* #1 Artist hero */}
          <Link
            to="/top-artists/$artistName"
            params={{ artistName: encodeURIComponent(topArtist.artistName) }}
            className="group relative block overflow-hidden rounded-[20px] border border-border bg-card p-5 shadow-xs transition-colors hover:border-primary/40 sm:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.14] via-primary/[0.03] to-transparent"
            />
            <div className="relative flex items-center gap-5 sm:gap-8">
              <Avatar className="size-24 shrink-0 shadow-lg ring-4 ring-background sm:size-[132px]">
                <AvatarImage
                  src={topArtist.imageUrl || undefined}
                  alt={topArtist.artistName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-4xl font-bold text-primary-foreground sm:text-5xl">
                  {topArtist.artistName.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Eyebrow className="text-primary">#1 artist</Eyebrow>
                <h2 className="truncate text-2xl leading-tight font-bold tracking-[-0.03em] transition-colors group-hover:text-primary sm:text-[32px]">
                  {topArtist.artistName}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {plural(Number(topArtist.plays), 'play')} ·{' '}
                  {formatDurationShort(Number(topArtist.totalMsPlayed))} listened
                  {totalPlays ? (
                    <span className="hidden sm:inline">
                      {' '}
                      · {Math.round((Number(topArtist.plays) / totalPlays) * 100)}% of your plays
                    </span>
                  ) : null}
                </p>
              </div>
              <span className="hidden text-6xl leading-none font-bold text-foreground/10 tabular-nums lg:block">
                01
              </span>
            </div>
          </Link>

          {/* Rest of artists */}
          {restArtists.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {restArtists.map((artist, index) => {
                const rank = index + 2
                return (
                  <Link
                    key={`${artist.artistName}-${rank}`}
                    to="/top-artists/$artistName"
                    params={{ artistName: encodeURIComponent(artist.artistName) }}
                    className="group relative flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 pt-8 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:gap-4 sm:p-5 sm:pt-9"
                  >
                    <span className="absolute top-3 left-4 text-xs font-bold text-muted-foreground tabular-nums">
                      {String(rank).padStart(2, '0')}
                    </span>
                    <Avatar className="aspect-square size-auto w-full max-w-[132px] shrink-0">
                      <AvatarImage
                        src={artist.imageUrl || undefined}
                        alt={artist.artistName}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-muted text-4xl font-bold text-muted-foreground">
                        {artist.artistName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex w-full min-w-0 flex-col gap-0.5">
                      <p className="truncate text-[15px] font-semibold transition-colors group-hover:text-primary">
                        {artist.artistName}
                      </p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {plural(Number(artist.plays), 'play')} ·{' '}
                        {formatDurationShort(Number(artist.totalMsPlayed))}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={<IconUsers className="size-5" />}
          title="No artists in this range"
          description="Try a longer time range, or sync your recent plays from Spotify."
        />
      )}
    </div>
  )
}
