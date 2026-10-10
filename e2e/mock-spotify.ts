// Minimal stand-in for the Spotify Web API + accounts service, so e2e runs
// never touch the network. Start with: node e2e/mock-spotify.ts
import http from "node:http"
import {
  E2E_MOCK_PORT,
  coverSvg,
  coverUrl,
  playlists,
  tracks,
} from "./fixtures.ts"
import type { FixturePlaylist } from "./fixtures.ts"

function send(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  type = "application/json",
) {
  res.writeHead(status, {
    "content-type": type,
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=3600",
  })
  res.end(type === "application/json" ? JSON.stringify(body) : String(body))
}

function playlistSummary(playlist: FixturePlaylist) {
  return {
    id: playlist.id,
    name: playlist.name,
    public: true,
    owner: { display_name: "Robin Example" },
    images: playlist.noImage ? [] : [{ url: coverUrl(playlist.id) }],
    tracks: { total: playlist.trackIds.length },
  }
}

function playlistTrackItems(playlist: FixturePlaylist) {
  return playlist.trackIds.map(id => {
    const track = tracks.find(t => t.id === id)!
    return {
      track: {
        id: track.id,
        name: track.name,
        duration_ms: track.durationMs,
        artists: [{ name: track.artistName }],
      },
    }
  })
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${E2E_MOCK_PORT}`)
  const path = url.pathname

  if (path === "/health") return send(res, 200, { ok: true })

  if (path.startsWith("/img/")) {
    const seed = decodeURIComponent(path.slice(5).replace(/\.svg$/, ""))
    return send(res, 200, coverSvg(seed), "image/svg+xml")
  }

  if (path === "/api/token" && req.method === "POST") {
    return send(res, 200, {
      access_token: "e2e-access-token",
      token_type: "Bearer",
      expires_in: 3600,
    })
  }

  if (path === "/v1/me/player/recently-played") {
    return send(res, 200, { items: [] })
  }

  if (path === "/v1/me/playlists") {
    return send(res, 200, { items: playlists.map(playlistSummary), next: null })
  }

  const playlistMatch = path.match(/^\/v1\/playlists\/([^/]+)(\/tracks)?$/)
  if (playlistMatch) {
    const playlist = playlists.find(p => p.id === playlistMatch[1])
    if (!playlist) return send(res, 404, { error: { status: 404, message: "Not found" } })
    const items = playlistTrackItems(playlist)
    if (playlistMatch[2]) return send(res, 200, { items: [], next: null })
    return send(res, 200, {
      ...playlistSummary(playlist),
      tracks: { total: items.length, items, next: null },
    })
  }

  return send(res, 404, { error: { status: 404, message: `No mock for ${path}` } })
})

server.listen(E2E_MOCK_PORT, () => {
  console.log(`[mock-spotify] listening on ${E2E_MOCK_PORT}`)
})
