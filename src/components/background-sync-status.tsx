import { useQuery } from "@tanstack/react-query"
import { IconLoader2 } from "@tabler/icons-react"
import { backgroundSyncStatusQueryOptions } from "@/lib/spotify-query-options"

export function formatRelative(iso: string | null) {
  if (!iso) {
    return "never"
  }

  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()

  if (diffMs < 60_000) {
    return "just now"
  }

  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) {
    return `${minutes}m ago`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const pillClass =
  "flex h-9 items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-xs"

export function BackgroundSyncStatus() {
  const statusQuery = useQuery(backgroundSyncStatusQueryOptions())

  if (statusQuery.isPending) {
    return (
      <div className={pillClass}>
        <IconLoader2 className="size-3 animate-spin" />
        <span>Checking…</span>
      </div>
    )
  }

  if (statusQuery.error || !statusQuery.data) {
    return null
  }

  if (statusQuery.data.isRunning) {
    return (
      <div className={`${pillClass} border-primary/30 bg-primary/10 text-primary`}>
        <IconLoader2 className="size-3 animate-spin" />
        <span>Syncing…</span>
      </div>
    )
  }

  const { lastCompletedAt, lastPersistedAt, lastErrorAt } = statusQuery.data
  const lastSync = lastCompletedAt ?? lastPersistedAt
  const failed =
    lastErrorAt !== null && (lastSync === null || lastErrorAt > lastSync)

  return (
    <div
      className={pillClass}
      title={lastSync ? `Last synced ${formatRelative(lastSync)}` : undefined}
    >
      <span
        className={`size-1.5 rounded-full ${failed ? "bg-amber-500" : "bg-emerald-500"}`}
      />
      <span>{failed ? "Sync delayed" : "Synced"}</span>
    </div>
  )
}
