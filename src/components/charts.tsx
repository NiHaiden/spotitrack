import { useId, useMemo } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  formatDayLong,
  formatDayShort,
  formatHourLong,
  formatHourTick,
} from "@/lib/format"
import { cn } from "@/lib/utils"

const axisTick = { fill: "currentColor", fontSize: 11 }

function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

/**
 * The API only returns days that have plays. Fill the gaps with zeros so the
 * x-axis is a real timeline instead of silently skipping quiet days.
 */
export function fillDayGaps<T extends { day: string }>(
  rows: Array<T>,
  empty: (day: string) => T,
  options?: { from?: Date; to?: Date },
): Array<T> {
  if (!rows.length) return rows
  const byDay = new Map(rows.map(row => [row.day, row]))
  const first = new Date(`${rows[0].day}T00:00:00Z`)
  const from = options?.from && options.from > first ? options.from : first
  const lastRow = new Date(`${rows[rows.length - 1].day}T00:00:00Z`)
  const to = options?.to && options.to > lastRow ? options.to : lastRow

  const out: Array<T> = []
  const cursor = new Date(`${utcDayKey(from)}T00:00:00Z`)
  // Guard against absurd spans ("all time" with ancient imports).
  for (let i = 0; cursor <= to && i < 2000; i++) {
    const key = utcDayKey(cursor)
    out.push(byDay.get(key) ?? empty(key))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

export function TrendChart({
  data,
  label,
  color = "var(--chart-1)",
  valueFormatter = value => String(value),
  yTickFormatter,
  allowDecimals = false,
  onSelectDay,
  selectedDay,
  className,
}: {
  data: Array<{ day: string; value: number }>
  label: string
  color?: string
  valueFormatter?: (value: number) => string
  yTickFormatter?: (value: number) => string
  allowDecimals?: boolean
  onSelectDay?: (day: string) => void
  selectedDay?: string | null
  className?: string
}) {
  const gradientId = `fill-${useId().replace(/:/g, "")}`
  const config = useMemo(
    () => ({ value: { label, color } }) satisfies ChartConfig,
    [label, color],
  )
  const showDots = data.length <= 31

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-[260px] w-full sm:h-[300px]", className)}
    >
      <AreaChart
        data={data}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        onClick={state => {
          const day = (state as { activePayload?: Array<{ payload?: { day?: string } }> } | null)
            ?.activePayload?.[0]?.payload?.day
          if (day && onSelectDay) onSelectDay(day)
        }}
        className={onSelectDay ? "cursor-pointer" : undefined}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis
          dataKey="day"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={24}
          tick={axisTick}
          tickFormatter={value => formatDayShort(String(value))}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={yTickFormatter ? 48 : 36}
          allowDecimals={allowDecimals}
          tick={axisTick}
          tickFormatter={yTickFormatter ? value => yTickFormatter(Number(value)) : undefined}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const day = (payload[0]?.payload as { day?: string } | undefined)?.day
                return day ? formatDayLong(day) : ""
              }}
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      className="size-2 rounded-[2px]"
                      style={{ background: item.color ?? "var(--color-value)" }}
                    />
                    {label}
                  </span>
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {valueFormatter(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={
            showDots
              ? props => {
                  const { cx, cy, payload, index } = props as {
                    cx: number
                    cy: number
                    payload: { day: string }
                    index: number
                  }
                  const selected = payload.day === selectedDay
                  return (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={selected ? 4.5 : 2}
                      fill={selected ? "var(--background)" : "var(--color-value)"}
                      stroke="var(--color-value)"
                      strokeWidth={selected ? 2.5 : 0}
                    />
                  )
                }
              : false
          }
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}

export function HourChart({
  data,
  label = "Plays",
  className,
}: {
  data: Array<{ hour: number; plays: number }>
  label?: string
  className?: string
}) {
  const config = useMemo(
    () => ({ plays: { label, color: "var(--chart-1)" } }) satisfies ChartConfig,
    [label],
  )
  const hours = useMemo(() => {
    const map = new Map(data.map(item => [Number(item.hour), Number(item.plays)]))
    return Array.from({ length: 24 }, (_, hour) => ({ hour, plays: map.get(hour) ?? 0 }))
  }, [data])
  const peak = Math.max(0, ...hours.map(h => h.plays))

  return (
    <ChartContainer
      config={config}
      className={cn("aspect-auto h-[220px] w-full sm:h-[260px]", className)}
    >
      <BarChart data={hours} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeOpacity={0.5} />
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={2}
          tick={axisTick}
          tickFormatter={value => formatHourTick(Number(value))}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={36}
          allowDecimals={false}
          tick={axisTick}
        />
        <ChartTooltip
          cursor={{ fillOpacity: 0.5 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const hour = (payload[0]?.payload as { hour?: number } | undefined)?.hour
                return hour === undefined
                  ? ""
                  : `${formatHourLong(hour)} – ${formatHourLong((hour + 1) % 24)}`
              }}
            />
          }
        />
        <Bar dataKey="plays" radius={[4, 4, 0, 0]} maxBarSize={28}>
          {hours.map(item => (
            <Cell
              key={item.hour}
              fill="var(--color-plays)"
              fillOpacity={peak && item.plays === peak ? 1 : 0.45}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

/** Hour (0-23) with the most plays, or null. */
export function peakHour(data: Array<{ hour: number; plays: number }>) {
  let best: { hour: number; plays: number } | null = null
  for (const item of data) {
    if (!best || Number(item.plays) > best.plays) {
      best = { hour: Number(item.hour), plays: Number(item.plays) }
    }
  }
  return best && best.plays > 0 ? best.hour : null
}

/** Axis label for a minutes value: "45m", "2h", "1h 15m". */
export function formatMinutesTick(minutes: number) {
  if (minutes === 0) return "0"
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  if (!h) return `${m}m`
  return m ? `${h}h ${m}m` : `${h}h`
}
