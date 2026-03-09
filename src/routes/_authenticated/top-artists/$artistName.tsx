import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import type { StatsRange } from '@/lib/stats-range'
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
import { statsRangeLabel } from '@/lib/stats-range'

export const Route = createFileRoute('/_authenticated/top-artists/$artistName')({
  component: ArtistDetailPage,
})

const trendChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function ArtistDetailPage() {
  const { artistName: rawArtistName } = Route.useParams()
  const artistName = decodeURIComponent(rawArtistName)
  const [range, setRange] = useState<StatsRange>('30d')

  const artistsQuery = useQuery(topArtistsQueryOptions(range))
  const artists = artistsQuery.data?.items ?? []
  const artistData = artists.find(a => a.artistName === artistName)
  const rank = artists.findIndex(a => a.artistName === artistName) + 1

  const detailQuery = useQuery(artistDetailQueryOptions(range, artistName))

  return (
    <div className="space-y-4">
      {/* Breadcrumb + Range selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px]">
          <Link to="/top-artists" className="text-muted-foreground hover:text-foreground transition-colors">
            Top Artists
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground font-medium">{artistName}</span>
        </div>
        <StatsRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Artist hero */}
      <div className="rounded-[20px] border border-border bg-gradient-to-br from-primary/[0.12] via-primary/[0.03] to-background p-8 lg:px-10">
        <div className="flex items-center gap-8">
          <Avatar className="size-[140px] shrink-0 rounded-full">
            <AvatarImage src={artistData?.imageUrl || undefined} alt={artistName} />
            <AvatarFallback className="bg-gradient-to-br from-primary via-primary/50 to-card text-background/40 text-5xl font-bold">
              {artistName.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex flex-col gap-2 justify-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
              {rank > 0 ? `#${rank} ARTIST · ` : ''}{statsRangeLabel(range).toUpperCase()}
            </p>
            <h1 className="text-4xl font-bold tracking-[-0.03em]">{artistName}</h1>
            {artistData ? (
              <p className="text-base text-muted-foreground">
                {detailQuery.data?.topTracks.length ?? 0} tracks listened
              </p>
            ) : null}
          </div>
          <div className="hidden sm:flex items-center gap-12">
            {detailQuery.data ? (
              <>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{detailQuery.data.totals.totalPlays}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">PLAYS</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{formatDurationShort(detailQuery.data.totals.totalMsPlayed)}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">LISTENED</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{detailQuery.data.totals.uniqueTracks}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">TRACKS</p>
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
      ) : detailQuery.data ? (
        <>
          {/* Chart + Breakdown */}
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex flex-col gap-0.5">
                <h3 className="text-base font-semibold">Plays over time</h3>
                <p className="text-xs text-muted-foreground">Daily plays of {artistName} · last 14 days</p>
              </div>
              {detailQuery.data.byDay.length ? (
                <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                  <AreaChart data={detailQuery.data.byDay} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillPlaysArtist" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#fillPlaysArtist)"
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
              <h3 className="mb-4 text-base font-semibold">Listening breakdown</h3>
              <div className="space-y-0 divide-y divide-border">
                <DetailRow
                  label="Avg. plays / day"
                  value={
                    detailQuery.data.byDay.length
                      ? (detailQuery.data.totals.totalPlays / Math.max(detailQuery.data.byDay.length, 1)).toFixed(1)
                      : '—'
                  }
                />
                <DetailRow
                  label="Avg. time / day"
                  value={
                    detailQuery.data.byDay.length
                      ? formatDurationShort(detailQuery.data.totals.totalMsPlayed / Math.max(detailQuery.data.byDay.length, 1))
                      : '—'
                  }
                />
                <DetailRow
                  label="Peak day"
                  value={
                    detailQuery.data.byDay.length
                      ? (() => {
                          const peak = detailQuery.data.byDay.reduce((a, b) => a.plays > b.plays ? a : b)
                          const d = new Date(peak.day + 'T12:00:00')
                          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        })()
                      : '—'
                  }
                  accent
                />
                <DetailRow label="Peak hour" value="—" />
                <DetailRow
                  label="First listened"
                  value={
                    detailQuery.data.byDay.length
                      ? (() => {
                          const first = detailQuery.data.byDay[0]
                          const d = new Date(first.day + 'T12:00:00')
                          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        })()
                      : '—'
                  }
                />
                <DetailRow
                  label="Share of listening"
                  value={
                    artists.length && detailQuery.data.totals.totalPlays
                      ? `${((detailQuery.data.totals.totalPlays / artists.reduce((sum, a) => sum + a.plays, 0)) * 100).toFixed(1)}%`
                      : '—'
                  }
                />
              </div>
            </div>
          </div>

          {/* Top tracks table */}
          {detailQuery.data.topTracks.length ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-base font-semibold">Top tracks by {artistName}</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/50">
                    <th className="px-6 py-3.5 w-12">#</th>
                    <th className="px-4 py-3.5">TRACK</th>
                    <th className="px-4 py-3.5 text-right">PLAYS</th>
                    <th className="px-4 py-3.5 text-right hidden sm:table-cell">TIME</th>
                    <th className="px-6 py-3.5 text-right hidden md:table-cell">SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {detailQuery.data.topTracks.map((track, index) => {
                    const share = detailQuery.data.totals.totalPlays
                      ? ((track.plays / detailQuery.data.totals.totalPlays) * 100).toFixed(1)
                      : '0'
                    const barWidth = detailQuery.data.topTracks[0].plays
                      ? Math.max(4, Math.round((track.plays / detailQuery.data.topTracks[0].plays) * 100))
                      : 4
                    return (
                      <tr
                        key={`${track.trackId || track.trackName}-${index}`}
                        className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${index === 0 ? 'bg-gradient-to-r from-primary/[0.08] to-transparent' : ''}`}
                      >
                        <td className={`px-6 py-3.5 text-sm tabular-nums font-semibold ${index === 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5 text-[15px] font-medium">{track.trackName}</td>
                        <td className={`px-4 py-3.5 text-right text-sm font-semibold tabular-nums ${index === 0 ? 'text-primary' : ''}`}>
                          {track.plays}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-muted-foreground hidden sm:table-cell">
                          {formatDurationShort(track.totalMsPlayed)}
                        </td>
                        <td className="px-6 py-3.5 text-right hidden md:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${barWidth}%` }} />
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{share}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
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
