import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@tabler/icons-react"
import { playlistsQueryOptions } from "@/lib/spotify-query-options"

export const Route = createFileRoute("/_authenticated/playlists")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(playlistsQueryOptions(50)),
  component: PlaylistsPage,
})

function PlaylistsPage() {
  const playlistsQuery = useQuery(playlistsQueryOptions(50))

  const items = playlistsQuery.data?.items ?? []

  return (
    <div className="space-y-6 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Playlists</h2>
          <p className="text-muted-foreground">
            Your Spotify playlists and ownership details.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => playlistsQuery.refetch()}
          disabled={playlistsQuery.isFetching}
        >
          <IconRefresh className="mr-2 size-4" />
          {playlistsQuery.isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {playlistsQuery.error instanceof Error ? (
        <p className="text-sm text-destructive">{playlistsQuery.error.message}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {playlistsQuery.isPending
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : items.map(item => {
              const image = item.images?.[0]?.url

              return (
                <Card key={item.id} className="overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={item.name}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                      No cover
                    </div>
                  )}
                  <CardHeader>
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      by {item.owner?.display_name ?? "Unknown"}
                    </p>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    <p>{item.tracks?.total ?? 0} tracks</p>
                    <p>{item.public ? "Public" : "Private"}</p>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {!playlistsQuery.isPending && !items.length ? (
        <p className="text-sm text-muted-foreground">No playlists found.</p>
      ) : null}
    </div>
  )
}
