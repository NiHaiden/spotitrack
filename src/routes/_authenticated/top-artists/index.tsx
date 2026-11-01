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
    <div className="space-y-8 lg:space-y-10">
      <PageHeader
        title="Top artists"
        description={
          range === 'all'
            ? 'Artists you listen to the most, all time'
            : `Artists you listen to the most · ${statsRangeLabel(range)}`
        }
        actions={<StatsRangeSelector value={range} onChange={setRange} />}
      />

      <ErrorNotice
        message={
          artistsQuery.error instanceof Error
            ? artistsQuery.error.message
            : null
        }
      />

      {artistsQuery.isPending ? (
        <>
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-full" />
            ))}
          </div>
        </>
      ) : topArtist ? (
        <>
          {/* The #1 artist leads, on the page's one soft surface */}
          <Link
            to="/top-artists/$artistName"
            params={{ artistName: encodeURIComponent(topArtist.artistName) }}
            className="group flex items-center gap-5 rounded-2xl bg-muted/60 p-5 transition-colors hover:bg-muted sm:gap-8 sm:p-6 dark:bg-card dark:hover:bg-muted"
          >
            <Avatar className="size-24 shrink-0 sm:size-40">
              <AvatarImage
                src={topArtist.imageUrl || undefined}
                alt=""
                className="object-cover"
              />
              <AvatarFallback className="bg-background text-4xl font-semibold text-muted-foreground sm:text-5xl">
                {topArtist.artistName.slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Eyebrow className="text-primary">#1 artist</Eyebrow>
              <h2 className="truncate text-2xl leading-tight font-bold tracking-[-0.03em] sm:text-[32px]">
                {topArtist.artistName}
              </h2>
              <p className="text-sm text-muted-foreground tabular-nums">
                {plural(Number(topArtist.plays), 'play')} ·{' '}
                {formatDurationShort(Number(topArtist.totalMsPlayed))} listened
                {totalPlays ? (
                  <span className="hidden sm:inline">
                    {' '}
                    · {Math.round((Number(topArtist.plays) / totalPlays) * 100)}
                    % of your plays
                  </span>
                ) : null}
              </p>
            </div>
          </Link>

          {/* The rest: a ranked grid of faces, grouped by space, no boxes */}
          {restArtists.length ? (
            <div className="-mx-3 grid grid-cols-2 gap-y-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
              {restArtists.map((artist, index) => {
                const rank = index + 2
                return (
                  <Link
                    key={`${artist.artistName}-${rank}`}
                    to="/top-artists/$artistName"
                    params={{
                      artistName: encodeURIComponent(artist.artistName),
                    }}
                    className="group flex min-w-0 flex-col gap-3 rounded-xl p-3 transition-colors hover:bg-muted/70"
                  >
                    <Avatar className="aspect-square size-auto w-full">
                      <AvatarImage
                        src={artist.imageUrl || undefined}
                        alt=""
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted text-4xl font-semibold text-muted-foreground">
                        {artist.artistName.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate text-[15px] leading-snug font-semibold">
                        <span className="font-medium text-muted-foreground tabular-nums">
                          {String(rank).padStart(2, '0')}
                        </span>{' '}
                        {artist.artistName}
                      </p>
                      <p className="truncate text-[13px] leading-snug text-muted-foreground tabular-nums">
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
