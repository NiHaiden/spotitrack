import { useQuery } from "@tanstack/react-query"
import { IconLoader2 } from "@tabler/icons-react"
import { backgroundSyncStatusQueryOptions } from "@/lib/spotify-query-options"

function formatRelative(iso: string | null) {
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

export function BackgroundSyncStatus() {
  const statusQuery = useQuery(backgroundSyncStatusQueryOptions())

  if (statusQuery.isPending) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] bg-card px-3 py-2 text-xs text-muted-foreground">
        <IconLoader2 className="size-3 animate-spin" />
        <span>Sync status...</span>
      </div>
    )
  }

  if (statusQuery.error || !statusQuery.data) {
    return null
  }

  if (statusQuery.data.isRunning) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] bg-primary/10 px-3 py-2 text-xs text-primary">
        <IconLoader2 className="size-3 animate-spin" />
        <span>Syncing...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-card px-3 py-2 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      <span>Synced</span>
    </div>
  )
}
