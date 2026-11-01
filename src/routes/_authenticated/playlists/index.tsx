import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { IconPlaylist, IconRefresh } from '@tabler/icons-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState, ErrorNotice, PageHeader } from '@/components/page'
import { playlistsQueryOptions } from '@/lib/spotify-query-options'
import { plural } from '@/lib/format'

export const Route = createFileRoute('/_authenticated/playlists/')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(playlistsQueryOptions(50)),
  component: PlaylistsPage,
})

function PlaylistsPage() {
  const playlistsQuery = useQuery(playlistsQueryOptions(50))
  const playlists = playlistsQuery.data?.items ?? []

  return (
    <div className="space-y-8 lg:space-y-10">
      <PageHeader
        title="Playlists"
        description="Your Spotify playlists and how much you play them"
        actions={
          <Button
            variant="outline"
            onClick={() => playlistsQuery.refetch()}
            disabled={playlistsQuery.isFetching}
          >
            <IconRefresh
              className={playlistsQuery.isFetching ? 'animate-spin' : undefined}
            />
            {playlistsQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <ErrorNotice
        message={
          playlistsQuery.error instanceof Error
            ? playlistsQuery.error.message
            : null
        }
      />

      {playlistsQuery.isPending ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      ) : playlists.length ? (
        <div className="-mx-3 grid grid-cols-2 gap-y-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {playlists.map((playlist) => {
            const image = playlist.images?.[0]?.url
            return (
              <Link
                key={playlist.id}
                to="/playlists/$playlistId"
                params={{ playlistId: playlist.id }}
                className="group flex min-w-0 flex-col gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted/70"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted shadow-xs">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <IconPlaylist className="size-10 text-muted-foreground/60" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-[15px] leading-snug font-semibold">
                    {playlist.name}
                  </p>
                  <p className="truncate text-[13px] leading-snug text-muted-foreground">
                    {plural(playlist.tracks?.total ?? 0, 'track')}
                    {playlist.owner?.display_name
                      ? ` · ${playlist.owner.display_name}`
                      : ''}
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
