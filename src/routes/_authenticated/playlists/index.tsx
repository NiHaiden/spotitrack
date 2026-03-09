import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { IconMusic, IconRefresh } from "@tabler/icons-react"
import { playlistsQueryOptions } from "@/lib/spotify-query-options"

export const Route = createFileRoute("/_authenticated/playlists/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(playlistsQueryOptions(50)),
  component: PlaylistsPage,
})

function PlaylistsPage() {
  const playlistsQuery = useQuery(playlistsQueryOptions(50))
  const playlists = playlistsQuery.data?.items ?? []

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold tracking-[-0.03em] leading-[34px]">Playlists</h1>
          <p className="text-sm text-muted-foreground">Your tracked Spotify playlists</p>
        </div>
        <button
          type="button"
          onClick={() => playlistsQuery.refetch()}
          disabled={playlistsQuery.isFetching}
          className="flex items-center gap-1.5 rounded-[10px] bg-card px-4 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <IconRefresh className={`size-3.5 ${playlistsQuery.isFetching ? 'animate-spin' : ''}`} />
          {playlistsQuery.isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {playlistsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{playlistsQuery.error.message}</p>
      ) : null}

      {/* Playlist grid */}
      {playlistsQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      ) : playlists.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {playlists.map((playlist, index) => {
            const image = playlist.images?.[0]?.url
            return (
              <Link
                key={playlist.id}
                to="/playlists/$playlistId"
                params={{ playlistId: playlist.id }}
                className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-left transition-all hover:bg-muted/20"
              >
                <div className="aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-gradient-to-br from-primary/60 via-primary/20 to-card">
                  {image ? (
                    <img
                      src={image}
                      alt={playlist.name}
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <IconMusic className="size-10 text-background/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="truncate text-base font-semibold">{playlist.name}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {playlist.tracks?.total ?? 0} tracks
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-border bg-card">
          <p className="text-sm text-muted-foreground">No playlists found.</p>
        </div>
      )}
    </div>
  )
}
