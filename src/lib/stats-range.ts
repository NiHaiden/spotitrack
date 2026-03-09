export type StatsRange = "24h" | "3d" | "7d" | "30d" | "6m" | "all"

export const statsRangeOptions: Array<{ value: StatsRange; label: string }> = [
  { value: "24h", label: "24h" },
  { value: "3d", label: "3 Days" },
  { value: "7d", label: "7 Days" },
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
  } else if (range === "30d") {
    date.setDate(date.getDate() - 30)
  } else if (range === "7d") {
    date.setDate(date.getDate() - 7)
  } else if (range === "3d") {
    date.setDate(date.getDate() - 3)
  } else if (range === "24h") {
    date.setDate(date.getDate() - 1)
  }

  return date
}
