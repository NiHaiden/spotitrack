import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { IconPlaylist, IconRefresh } from "@tabler/icons-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { EmptyState, ErrorNotice, PageHeader } from "@/components/page"
import { playlistsQueryOptions } from "@/lib/spotify-query-options"
import { plural } from "@/lib/format"

export const Route = createFileRoute("/_authenticated/playlists/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(playlistsQueryOptions(50)),
  component: PlaylistsPage,
})

function PlaylistsPage() {
  const playlistsQuery = useQuery(playlistsQueryOptions(50))
  const playlists = playlistsQuery.data?.items ?? []

  return (
    <div className="space-y-6 lg:space-y-7">
      <PageHeader
        title="Playlists"
        description="Your Spotify playlists and how much you play them"
        actions={
          <Button
            variant="outline"
            onClick={() => playlistsQuery.refetch()}
            disabled={playlistsQuery.isFetching}
          >
            <IconRefresh className={playlistsQuery.isFetching ? "animate-spin" : undefined} />
            {playlistsQuery.isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <ErrorNotice
        message={playlistsQuery.error instanceof Error ? playlistsQuery.error.message : null}
      />

      {playlistsQuery.isPending ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-2xl" />
          ))}
        </div>
      ) : playlists.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {playlists.map(playlist => {
            const image = playlist.images?.[0]?.url
            return (
              <Link
                key={playlist.id}
                to="/playlists/$playlistId"
                params={{ playlistId: playlist.id }}
                className="group flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:p-4"
              >
                <div className="aspect-square w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/70 via-primary/30 to-muted">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <IconPlaylist className="size-10 text-primary-foreground/70" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5 px-0.5">
                  <p className="truncate text-[15px] font-semibold transition-colors group-hover:text-primary">
                    {playlist.name}
                  </p>
                  <p className="truncate text-[13px] text-muted-foreground">
                    {plural(playlist.tracks?.total ?? 0, "track")}
                    {playlist.owner?.display_name ? ` · ${playlist.owner.display_name}` : ""}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <EmptyState
          icon={<IconPlaylist className="size-5" />}
          title="No playlists found"
          description="Playlists you create or follow on Spotify will show up here."
        />
      )}
    </div>
  )
}
