import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import type { ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { IconMusic } from '@tabler/icons-react'
import { formatDurationShort } from '@/lib/spotify-client'
import { playlistInsightsQueryOptions } from '@/lib/spotify-query-options'

export const Route = createFileRoute('/_authenticated/playlists/$playlistId')({
  component: PlaylistDetailPage,
})

const trendChartConfig = {
  plays: {
    label: 'Plays',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

function PlaylistDetailPage() {
  const { playlistId } = Route.useParams()

  const insightsQuery = useQuery(playlistInsightsQueryOptions(playlistId))
  const data = insightsQuery.data

  const byDayData = (data?.tracked.byDay ?? []).map(day => ({
    ...day,
    label: day.day.slice(5),
  }))

  const topTrackData = (data?.tracked.topTracks ?? []).slice(0, 10)

  return (
    <div className="space-y-7">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        <Link to="/playlists" className="text-muted-foreground hover:text-foreground transition-colors">
          Playlists
        </Link>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium">{data?.playlist.name ?? 'Loading...'}</span>
      </div>


      {insightsQuery.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
      ) : data ? (
        <>
          {/* Playlist hero */}
          <div className="rounded-[20px] border border-border bg-gradient-to-br from-primary/[0.12] via-primary/[0.03] to-background p-8 lg:px-10">
            <div className="flex items-center gap-8">
              <div className="size-[140px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary via-primary/50 to-card">
                {data.playlist.imageUrl ? (
                  <img src={data.playlist.imageUrl} alt={data.playlist.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    <IconMusic className="size-12 text-background/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                  PLAYLIST · {data.playlist.trackCount} TRACKS
                </p>
                <h1 className="text-4xl font-bold tracking-[-0.03em]">{data.playlist.name}</h1>
                <p className="text-base text-muted-foreground">
                  {formatDurationShort(data.tracked.totals.totalMsPlayed)} total length
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-12">
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{data.tracked.totals.totalPlays}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">TIMES PLAYED</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{formatDurationShort(data.tracked.totals.totalMsPlayed)}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">TOTAL TIME</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <p className="text-[42px] font-bold tracking-[-0.03em] leading-10 tabular-nums">{data.coverage.trackedTracks}</p>
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">ARTISTS</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 flex flex-col gap-0.5">
                <h3 className="text-base font-semibold">Plays over time</h3>
                <p className="text-xs text-muted-foreground">Daily plays from this playlist · last 14 days</p>
              </div>
              {byDayData.length ? (
                <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
                  <AreaChart data={byDayData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillPlaysPlaylist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-plays)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--color-plays)" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeOpacity={0.08} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 12 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'currentColor', opacity: 0.4, fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="plays"
                      stroke="var(--color-plays)"
                      strokeWidth={2}
                      fill="url(#fillPlaysPlaylist)"
                      dot={{ r: 2, fill: 'var(--color-plays)' }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <p className="text-sm text-muted-foreground">No tracked plays for this playlist.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold">Playlist stats</h3>
              <div className="space-y-0 divide-y divide-[oklch(0.17_0_0)]">
                <DetailRow
                  label="Avg. plays / day"
                  value={
                    byDayData.length
                      ? (data.tracked.totals.totalPlays / Math.max(byDayData.length, 1)).toFixed(1)
                      : '—'
                  }
                />
                <DetailRow
                  label="Avg. time / day"
                  value={
                    byDayData.length
                      ? formatDurationShort(data.tracked.totals.totalMsPlayed / Math.max(byDayData.length, 1))
                      : '—'
                  }
                />
                <DetailRow
                  label="Peak day"
                  value={
                    byDayData.length
                      ? (() => {
                          const peak = byDayData.reduce((a, b) => a.plays > b.plays ? a : b)
                          const d = new Date(peak.day + 'T12:00:00')
                          return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                        })()
                      : '—'
                  }
                  accent
                />
                <DetailRow label="Peak hour" value="—" />
                <DetailRow
                  label="% of all plays"
                  value="—"
                />
                <DetailRow
                  label="Completion rate"
                  value={
                    data.coverage.totalTracks
                      ? `${Math.round((data.coverage.trackedTracks / data.coverage.totalTracks) * 100)}%`
                      : '—'
                  }
                  accent
                />
              </div>
            </div>
          </div>

          {/* Tracks in playlist */}
          {topTrackData.length ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-6 py-4 border-b border-[oklch(0.17_0_0)]">
                <h3 className="text-base font-semibold">Tracks in this playlist</h3>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground/50">
                    <th className="px-6 py-3.5 w-12">#</th>
                    <th className="px-4 py-3.5">TRACK</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">ARTIST</th>
                    <th className="px-4 py-3.5 text-right">PLAYS</th>
                    <th className="px-4 py-3.5 text-right hidden sm:table-cell">TIME</th>
                    <th className="px-6 py-3.5 text-right hidden md:table-cell">SHARE</th>
                  </tr>
                </thead>
                <tbody>
                  {topTrackData.map((track, index) => {
                    const totalPlays = data.tracked.totals.totalPlays
                    const share = totalPlays ? ((track.plays / totalPlays) * 100).toFixed(1) : '0'
                    const barWidth = topTrackData[0].plays
                      ? Math.max(4, Math.round((track.plays / topTrackData[0].plays) * 100))
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
                        <td className="px-4 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{track.artistName}</td>
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
      ) : (
        <p className="text-sm text-destructive">
          {insightsQuery.error instanceof Error ? insightsQuery.error.message : 'Failed to load playlist.'}
        </p>
      )}
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
