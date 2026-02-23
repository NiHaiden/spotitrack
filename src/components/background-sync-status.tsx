import { useQuery } from "@tanstack/react-query"
import { IconLoader2, IconRefresh, IconRefreshAlert } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
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
      <Badge variant="outline" className="gap-1.5">
        <IconLoader2 className="size-3 animate-spin" />
        Sync status…
      </Badge>
    )
  }

  if (statusQuery.error || !statusQuery.data) {
    return (
      <Badge variant="destructive" className="gap-1.5">
        <IconRefreshAlert className="size-3" />
        Sync unavailable
      </Badge>
    )
  }

  if (statusQuery.data.isRunning) {
    return (
      <Badge variant="default" className="gap-1.5">
        <IconLoader2 className="size-3 animate-spin" />
        Syncing in background
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className="gap-1.5">
      <IconRefresh className="size-3" />
      Last sync {formatRelative(statusQuery.data.lastPersistedAt)}
    </Badge>
  )
}
