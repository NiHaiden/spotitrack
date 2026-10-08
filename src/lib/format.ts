/** "1 play", "3 plays" */
export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count.toLocaleString()} ${count === 1 ? singular : pluralForm}`
}

/** Parses a `YYYY-MM-DD` bucket from the API without timezone drift. */
function parseDay(day: string) {
  return new Date(`${day}T12:00:00`)
}

/** "Sep 9" — compact axis/tick label for a `YYYY-MM-DD` bucket. */
export function formatDayShort(day: string) {
  return parseDay(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/** "Tue, Sep 9" — tooltip label for a `YYYY-MM-DD` bucket. */
export function formatDayLong(day: string) {
  return parseDay(day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/** Local `YYYY-MM-DD` key for a timestamp (for grouping by the viewer's day). */
export function localDayKey(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** "Today", "Yesterday" or "Sep 9" relative to now. */
export function formatRelativeDay(date: Date) {
  const today = localDayKey(new Date())
  const yesterday = localDayKey(new Date(Date.now() - 86_400_000))
  const key = localDayKey(date)
  if (key === today) return "Today"
  if (key === yesterday) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function formatTime(date: Date | string) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

/** "3:24" track-length style duration. */
export function formatTrackLength(ms: number | null | undefined) {
  if (!ms) return "—"
  const totalSeconds = Math.floor(ms / 1000)
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`
}

/** "12a", "3p" — compact hour-of-day tick. */
export function formatHourTick(hour: number) {
  const suffix = hour < 12 ? "a" : "p"
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}${suffix}`
}

/** "3 PM" — readable hour-of-day label. */
export function formatHourLong(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM"
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h} ${suffix}`
}

/** Human label for a play's `source` column ("spotify-recent", "import-privacy", …). */
export function describeSource(source: string): { label: string; tone: "live" | "import" } {
  if (source.startsWith("import")) return { label: "Import", tone: "import" }
  if (source.startsWith("spotify")) return { label: "Spotify", tone: "live" }
  return { label: source, tone: "import" }
}

export function initials(name: string | null | undefined) {
  if (!name) return "?"
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  )
}
