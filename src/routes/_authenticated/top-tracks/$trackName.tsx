import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import type { StatsRange } from '@/lib/stats-range'
import { Skeleton } from '@/components/ui/skeleton'
import { IconMusic } from '@tabler/icons-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { formatDurationShort } from '@/lib/spotify-client'
import {
  trackDetailQueryOptions,
  topTracksQueryOptions,
} from '@/lib/spotify-query-options'
import { StatsRangeSelector } from '@/components/stats-range-selector'
import { statsRangeLabel } from '@/lib/stats-range'

export const Route = createFileRoute('/_authenticated/top-tracks/$trackName')({
  validateSearch: (search: Record<string, unknown>) => ({
    artist: typeof search.artist === 'string' ? search.artist : undefined,
    trackId: typeof search.trackId === 'string' ? search.trackId : undefined,
  }),
  component: TrackDetailPage,
})

const trendChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

const hourChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

function TrackDetailPage() {
  const { trackName: rawTrackName } = Route.useParams()
  const { artist, trackId } = Route.useSearch()
  const trackName = decodeURIComponent(rawTrackName)
  const artistName = artist ? decodeURIComponent(artist) : undefined
  const [range, setRange] = useState<StatsRange>('30d')

  const tracksQuery = useQuery(topTracksQueryOptions(range))
  const tracks = tracksQuery.data?.items ?? []
  const trackData = tracks.find(t =>
    t.trackName === trackName && (!artistName || t.artistName === artistName)
  )
  const rank = tracks.findIndex(t =>
    t.trackName === trackName && (!artistName || t.artistName === artistName)
  ) + 1

  const detailQuery = useQuery(
    trackDetailQueryOptions(range, {
      trackId: trackId ?? trackData?.trackId ?? null,
      trackName,
      artistName: artistName ?? trackData?.artistName ?? null,
    }),
  )

  const detail = detailQuery.data

  return (
    <div className="space-y-7">
      {/* Breadcrumb + Range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to="/top-tracks" className="text-muted-foreground hover:text-foreground transition-colors">
            Top Tracks
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">{trackName}</span>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Track hero */}
      <div className="rounded-[20px] border border-border bg-gradient-to-br from-primary/[0.12] via-primary/[0.03] to-background p-8 lg:px-10">
        <div className="flex items-center gap-8">
          <div className="flex size-[140px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary/50 to-card">
            <IconMusic className="size-12 text-background/40" />
          </div>
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              {rank > 0 ? `#${rank} TRACK · ` : ''}{statsRangeLabel(range).toUpperCase()}
            </p>
            <h1 className="text-4xl font-bold tracking-[-0.03em]">{trackName}</h1>
            {artistName ? (
              <p className="text-base text-muted-foreground">{artistName}</p>
            ) : null}
          </div>
          <div className="hidden sm:flex items-center gap-12">
            {detail ? (
              <>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{detail.totals.totalPlays}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">PLAYS</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{formatDurationShort(detail.totals.totalMsPlayed)}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">TOTAL TIME</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">
                    {detail.totals.totalMsPlayed && detail.totals.totalPlays
                      ? formatDurationShort(detail.totals.totalMsPlayed / detail.totals.totalPlays)
                      : '—'}
                  </p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">DURATION</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {detailQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-[300px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      ) : detail ? (
        <div className="space-y-4">
          {/* Play frequency + Track details */}
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex flex-col gap-0.5">
                <h3 className="text-base font-semibold">Play frequency</h3>
                <p className="text-xs text-muted-foreground">Times played per day · last 14 days</p>
              </div>
              {detail.byDay.length ? (
                <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                  <AreaChart data={detail.byDay} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillPlaysTrack" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-plays)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-plays)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeOpacity={0.08} />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(v) => String(v).slice(5)}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 12 }}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="plays"
                      stroke="var(--color-plays)"
                      strokeWidth={2}
                      fill="url(#fillPlaysTrack)"
                      dot={{ r: 2, fill: 'var(--color-plays)' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No trend data yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold">Track details</h3>
              <div className="space-y-0 divide-y divide-[oklch(0.17_0_0)]">
                <DetailRow
                  label="Avg. plays / day"
                  value={
                    detail.byDay.length
                      ? (detail.totals.totalPlays / Math.max(detail.byDay.length, 1)).toFixed(1)
                      : '—'
                  }
                />
                <DetailRow
                  label="Peak plays (day)"
                  value={detail.byDay.length ? String(Math.max(...detail.byDay.map(d => d.plays))) : '—'}
                  accent
                />
                <DetailRow
                  label="Peak day"
                  value={
                    detail.byDay.length
                      ? (() => {
                          const peak = detail.byDay.reduce((a, b) => a.plays > b.plays ? a : b)
                          const d = new Date(peak.day + 'T12:00:00')
                          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        })()
                      : '—'
                  }
                  accent
                />
                <DetailRow
                  label="First played"
                  value={
                    detail.byDay.length
                      ? (() => {
                          const d = new Date(detail.byDay[0].day + 'T12:00:00')
                          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        })()
                      : '—'
                  }
                />
                <DetailRow
                  label="Last played"
                  value={
                    detail.recent.length
                      ? (() => {
                          const d = new Date(detail.recent[0].playedAt)
                          const isToday = d.toDateString() === new Date().toDateString()
                          return isToday ? 'Today' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        })()
                      : '—'
                  }
                />
                <DetailRow
                  label="% of all plays"
                  value={
                    tracks.length && detail.totals.totalPlays
                      ? `${((detail.totals.totalPlays / tracks.reduce((sum, t) => sum + t.plays, 0)) * 100).toFixed(1)}%`
                      : '—'
                  }
                />
              </div>
            </div>
          </div>

          {/* When you play + Recent plays */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">When you play this track</h3>
                <p className="text-sm text-muted-foreground">Hourly distribution of plays</p>
              </div>
              {(() => {
                const hourMap = new Map<number, number>()
                for (const item of detail.recent) {
                  const h = new Date(item.playedAt).getHours()
                  hourMap.set(h, (hourMap.get(h) ?? 0) + 1)
                }
                const hourData = Array.from({ length: 24 }, (_, h) => ({
                  hour: String(h).padStart(2, '0') + ':00',
                  plays: hourMap.get(h) ?? 0,
                }))
                return (
                  <ChartContainer config={hourChartConfig} className="h-[300px] w-full">
                    <BarChart data={hourData}>
                      <CartesianGrid vertical={false} strokeOpacity={0.08} />
                      <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10 }} tickFormatter={v => String(v).slice(0, 2)} />
                      <YAxis tickLine={false} axisLine={false} width={24} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="plays" fill="var(--color-plays)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )
              })()}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold">Recent plays</h3>
                <Link to="/recent" className="text-sm font-medium text-primary hover:underline">View all</Link>
              </div>
              {detail.recent.length ? (
                <div className="space-y-3">
                  {detail.recent.slice(0, 8).map((item) => {
                    const d = new Date(item.playedAt)
                    const isToday = d.toDateString() === new Date().toDateString()
                    const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString()
                    const dayLabel = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    return (
                      <div key={item.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{dayLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {item.source}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent plays found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className={`text-[15px] font-semibold tabular-nums ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  )
}
