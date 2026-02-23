import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import type { StatsRange } from '@/lib/stats-range'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatDurationShort } from '@/lib/spotify-client'
import {
  artistDetailQueryOptions,
  topArtistsQueryOptions,
} from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'

export const Route = createFileRoute('/_authenticated/top-artists')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topArtistsQueryOptions('30d')),
  component: TopArtistsPage,
})

const trendChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

function TopArtistsPage() {
  const [range, setRange] = useState<StatsRange>('30d')
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(
    null,
  )

  const artistsQuery = useQuery(topArtistsQueryOptions(range))
  const artists = artistsQuery.data?.items ?? []

  const activeArtist = selectedArtistName || artists[0]?.artistName || null

  const detailQuery = useQuery(artistDetailQueryOptions(range, activeArtist))

  const maxPlays = artists.length ? artists[0].plays : 1

  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Top Artists</h2>
          <p className="text-muted-foreground mt-1">
            Drill into your favorite artists and how their trend evolves.
          </p>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {artistsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">
          {artistsQuery.error.message}
        </p>
      ) : null}

      {/* Trend line chart — full width */}
      <Card className="shadow-sm border-border/60">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {activeArtist ? (
                  <span>
                    Trend for{' '}
                    <span className="text-primary">{activeArtist}</span>
                  </span>
                ) : (
                  'Artist trend'
                )}
              </CardTitle>
              <CardDescription>
                {activeArtist
                  ? 'Daily plays over the selected period.'
                  : 'Select an artist below to see their trend.'}
              </CardDescription>
            </div>
            {detailQuery.data ? (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total plays</p>
                  <p className="text-lg font-bold tabular-nums">
                    {detailQuery.data.totals.totalPlays}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Listening time
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {formatDurationShort(
                      detailQuery.data.totals.totalMsPlayed,
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Unique tracks
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {detailQuery.data.totals.uniqueTracks}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {detailQuery.isPending && activeArtist ? (
            <Skeleton className="h-[280px] w-full rounded-lg" />
          ) : detailQuery.data?.byDay.length ? (
            <ChartContainer
              config={trendChartConfig}
              className="h-[280px] w-full aspect-auto"
            >
              <AreaChart
                data={detailQuery.data.byDay}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="fillPlays" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--color-plays)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--color-plays)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  opacity={0.3}
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={(value) => String(value).slice(5)}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: 'currentColor',
                    opacity: 0.7,
                    fontSize: 12,
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{
                    fill: 'currentColor',
                    opacity: 0.7,
                    fontSize: 12,
                  }}
                />
                <ChartTooltip
                  cursor={{
                    stroke: 'var(--foreground)',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                    opacity: 0.2,
                  }}
                  content={<ChartTooltipContent />}
                />
                <Area
                  type="monotone"
                  dataKey="plays"
                  stroke="var(--color-plays)"
                  strokeWidth={2.5}
                  fill="url(#fillPlays)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: 'var(--color-plays)',
                    stroke: 'var(--background)',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                {activeArtist
                  ? 'No trend data for this artist yet.'
                  : 'Select an artist to see their trend.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artist grid */}
      <Card className="shadow-sm border-border/60 overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xl">Artists</CardTitle>
          <CardDescription>
            Select an artist to see their listening trend.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {artistsQuery.isPending ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : artists.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-border/40">
              {artists.slice(0, 15).map((artist, index) => {
                const isActive = artist.artistName === activeArtist
                const barWidth = Math.max(
                  4,
                  Math.round((artist.plays / maxPlays) * 100),
                )
                return (
                  <button
                    key={`${artist.artistName}-${index}`}
                    type="button"
                    onClick={() =>
                      setSelectedArtistName(artist.artistName)
                    }
                    className={`relative flex items-center gap-4 p-4 text-left transition-colors bg-card hover:bg-muted/50 overflow-hidden ${
                      isActive
                        ? 'bg-primary/5 shadow-[inset_4px_0_0_0_var(--primary)]'
                        : ''
                    }`}
                  >
                    {/* Subtle background bar showing relative plays */}
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/[0.04] transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    <div className="relative flex items-center gap-4 w-full">
                      <span className="text-xs font-bold tabular-nums text-muted-foreground/60 w-5 text-right shrink-0">
                        {index + 1}
                      </span>
                      <Avatar className="h-10 w-10 shrink-0 shadow-sm">
                        <AvatarImage
                          src={artist.imageUrl || undefined}
                          alt={artist.artistName}
                        />
                        <AvatarFallback className="text-xs font-semibold bg-muted">
                          {artist.artistName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-semibold leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}
                        >
                          {artist.artistName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {artist.plays}{' '}
                          {artist.plays === 1 ? 'play' : 'plays'} ·{' '}
                          {formatDurationShort(artist.totalMsPlayed)}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No artist data yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top songs for selected artist */}
      {detailQuery.data?.topTracks.length ? (
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              Top songs by{' '}
              <span className="text-primary">{activeArtist}</span>
            </CardTitle>
            <CardDescription>
              Most played tracks for this artist in the selected period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {detailQuery.data.topTracks.slice(0, 9).map((track, index) => {
                const trackMax = detailQuery.data.topTracks[0].plays
                const barWidth = Math.max(
                  8,
                  Math.round((track.plays / trackMax) * 100),
                )
                return (
                  <div
                    key={`${track.trackId || track.trackName}-${index}`}
                    className="relative flex items-center gap-3 rounded-lg border border-border/60 p-3 overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/[0.05] rounded-lg"
                      style={{ width: `${barWidth}%` }}
                    />
                    <span className="relative text-xs font-bold tabular-nums text-muted-foreground/60 w-5 text-right shrink-0">
                      {index + 1}
                    </span>
                    <div className="relative min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {track.trackName}
                      </p>
                    </div>
                    <span className="relative text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
                      {track.plays}×
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
