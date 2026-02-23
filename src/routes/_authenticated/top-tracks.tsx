import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatDurationShort, formatPlayedAt } from '@/lib/spotify-client'
import { statsRangeLabel } from '@/lib/stats-range'
import {
  topTracksQueryOptions,
  trackDetailQueryOptions,
} from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'

export const Route = createFileRoute('/_authenticated/top-tracks')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topTracksQueryOptions('30d')),
  component: TopTracksPage,
})

const playsChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const trendChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function trackSelectionKey(track: {
  trackId?: string | null
  trackName: string
  artistName: string
}) {
  return `${track.trackId || ''}::${track.trackName}::${track.artistName}`
}

function TopTracksPage() {
  const [range, setRange] = useState<StatsRange>('30d')
  const [selectedTrackKey, setSelectedTrackKey] = useState<string | null>(null)

  const tracksQuery = useQuery(topTracksQueryOptions(range))
  const tracks = tracksQuery.data?.items ?? []

  const selectedTrack = useMemo(() => {
    if (!tracks.length) {
      return null
    }

    const explicit = tracks.find(
      (track) => trackSelectionKey(track) === selectedTrackKey,
    )
    return explicit || tracks[0] || null
  }, [selectedTrackKey, tracks])

  const detailQuery = useQuery(
    trackDetailQueryOptions(
      range,
      selectedTrack
        ? {
            trackId: selectedTrack.trackId,
            trackName: selectedTrack.trackName,
            artistName: selectedTrack.artistName,
          }
        : null,
    ),
  )

  const barData = tracks.slice(0, 12).map((track) => ({
    key: trackSelectionKey(track),
    label:
      track.trackName.length > 16
        ? `${track.trackName.slice(0, 16)}…`
        : track.trackName,
    plays: track.plays,
  }))

  return (
    <div className="space-y-6 pt-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Top Tracks</h2>
          <p className="text-muted-foreground mt-1">
            Explore your most played songs and drill into trends.
          </p>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {tracksQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{tracksQuery.error.message}</p>
      ) : null}

      <div className="grid gap-6">
        <Card className="shadow-sm border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">
              {statsRangeLabel(range)} favorites
            </CardTitle>
            <CardDescription>Click a bar to inspect one track.</CardDescription>
          </CardHeader>
          <CardContent>
            {tracksQuery.isPending ? (
              <Skeleton className="h-[350px] w-full rounded-lg" />
            ) : barData.length ? (
              <ChartContainer
                config={playsChartConfig}
                className="h-[350px] w-full aspect-auto"
              >
                <BarChart
                  data={barData}
                  margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                  width={undefined}
                  height={undefined}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'currentColor', opacity: 0.7, fontSize: 12 }}
                    dx={-10}
                  />
                  <ChartTooltip
                    cursor={{ fill: 'var(--foreground)', opacity: 0.05 }}
                    content={<ChartTooltipContent />}
                  />
                  <Bar
                    dataKey="plays"
                    fill="var(--color-plays)"
                    radius={[6, 6, 0, 0]}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={(payload) => {
                      if (payload && 'key' in payload && payload.key) {
                        setSelectedTrackKey(String(payload.key))
                      }
                    }}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[350px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">
                  No track data yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col shadow-sm border-border/60 overflow-hidden">
          <CardHeader className="pb-4 bg-muted/20 border-b border-border/40">
            <CardTitle className="text-xl">Track list</CardTitle>
            <CardDescription>Choose a track to drill down.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {tracksQuery.isPending ? (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : tracks.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-border/40">
                {tracks.slice(0, 12).map((track, index) => {
                  const isActive =
                    selectedTrack &&
                    trackSelectionKey(track) ===
                      trackSelectionKey(selectedTrack)
                  return (
                    <button
                      key={`${track.trackId || track.trackName}-${index}`}
                      type="button"
                      onClick={() =>
                        setSelectedTrackKey(trackSelectionKey(track))
                      }
                      className={`flex w-full items-center justify-between p-4 text-left transition-colors bg-card hover:bg-muted/50 ${
                        isActive
                          ? 'bg-primary/5 shadow-[inset_4px_0_0_0_var(--primary)]'
                          : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p
                          className={`truncate font-medium ${isActive ? 'text-primary' : 'text-foreground'}`}
                        >
                          {track.trackName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">
                          {track.artistName}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center justify-center rounded-full bg-muted/50 h-8 px-2 min-w-8 text-xs font-semibold tabular-nums text-muted-foreground">
                        {track.plays}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center p-6">
                <p className="text-sm text-muted-foreground text-center">
                  No tracks tracked yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border/60 mt-8">
        <CardHeader className="pb-6 border-b border-border/40 bg-muted/10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Track trend</CardTitle>
              <CardDescription className="mt-1">
                {selectedTrack ? (
                  <span className="font-medium text-foreground/80">
                    {selectedTrack.trackName}{' '}
                    <span className="text-muted-foreground mx-1">•</span>{' '}
                    {selectedTrack.artistName}
                  </span>
                ) : (
                  'Select a track to see details'
                )}
              </CardDescription>
            </div>
            {selectedTrack && detailQuery.data && (
              <div className="hidden sm:flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
                    Total Plays
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-none">
                    {detailQuery.data.totals.totalPlays}
                  </p>
                </div>
                <div className="w-px h-10 bg-border/60"></div>
                <div className="text-right">
                  <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">
                    Listening Time
                  </p>
                  <p className="text-2xl font-bold tabular-nums leading-none">
                    {formatDurationShort(detailQuery.data.totals.totalMsPlayed)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {detailQuery.isPending ? (
            <Skeleton className="h-[300px] w-full rounded-lg" />
          ) : detailQuery.data.byDay.length ? (
            <div className="grid gap-8 lg:grid-cols-4">
              <div className="lg:col-span-3">
                <ChartContainer
                  config={trendChartConfig}
                  className="h-[300px] w-full aspect-auto"
                >
                  <LineChart
                    data={detailQuery.data.byDay}
                    margin={{ top: 20, right: 0, left: -20, bottom: 0 }}
                    width={undefined}
                    height={undefined}
                  >
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
                      dy={10}
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
                      dx={-10}
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
                    <Line
                      type="monotone"
                      dataKey="plays"
                      stroke="var(--color-plays)"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                        fill: 'var(--background)',
                        stroke: 'var(--color-plays)',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 6,
                        fill: 'var(--color-plays)',
                        stroke: 'var(--background)',
                        strokeWidth: 2,
                      }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>

              <div className="space-y-4 text-sm">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-1">
                    Total plays
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {detailQuery.data.totals.totalPlays}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-5 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-1">
                    Listening time
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-foreground">
                    {formatDurationShort(detailQuery.data.totals.totalMsPlayed)}
                  </p>
                </div>
                <div className="rounded-xl border border-border/60 p-5 shadow-sm">
                  <h4 className="font-semibold text-foreground/90 pb-3 border-b border-border/40 mb-3">
                    Recent listens
                  </h4>
                  {detailQuery.data.recent.length > 0 ? (
                    <div className="space-y-3">
                      {detailQuery.data.recent.slice(0, 8).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 group"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></div>
                          <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {formatPlayedAt(item.playedAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic text-sm">
                      No recent listens in this period.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                No drilldown data for this track yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
