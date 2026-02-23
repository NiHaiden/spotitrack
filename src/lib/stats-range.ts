export type StatsRange = "30d" | "6m" | "all"

export const statsRangeOptions: Array<{ value: StatsRange; label: string }> = [
  { value: "30d", label: "30 Days" },
  { value: "6m", label: "6 Months" },
  { value: "all", label: "All Time" },
]

export function statsRangeLabel(range: StatsRange) {
  const option = statsRangeOptions.find(item => item.value === range)
  return option?.label ?? "30 Days"
}

export function statsRangeStart(range: StatsRange, now = new Date()) {
  if (range === "all") {
    return new Date("2000-01-01T00:00:00.000Z")
  }

  const date = new Date(now)
  if (range === "6m") {
    date.setMonth(date.getMonth() - 6)
  } else {
    date.setDate(date.getDate() - 30)
  }

  return date
}
