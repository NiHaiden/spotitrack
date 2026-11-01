import { expect, test } from '@playwright/test'

// Every app endpoint must refuse anonymous callers. Params are deliberately
// bogus here: the session check runs first, so a 401 proves the gate — not the
// handler — answered.
const guarded: Array<{ method: 'GET' | 'POST'; path: string }> = [
  { method: 'GET', path: '/api/stats/overview' },
  { method: 'GET', path: '/api/stats/top-tracks' },
  { method: 'GET', path: '/api/stats/top-artists' },
  { method: 'GET', path: '/api/stats/recent' },
  { method: 'GET', path: '/api/stats/day?day=2026-01-01' },
  { method: 'GET', path: '/api/stats/track-detail' },
  { method: 'GET', path: '/api/stats/artist-detail' },
  { method: 'GET', path: '/api/spotify/playlists' },
  { method: 'GET', path: '/api/spotify/profile' },
  { method: 'GET', path: '/api/spotify/recent' },
  { method: 'GET', path: '/api/spotify/top-tracks' },
  { method: 'GET', path: '/api/spotify/top-artists' },
  { method: 'GET', path: '/api/spotify/playlist-insights' },
  { method: 'GET', path: '/api/spotify/background-sync-status' },
  { method: 'GET', path: '/api/imports' },
  { method: 'POST', path: '/api/imports/spotify' },
  { method: 'POST', path: '/api/spotify/sync-recent' },
]

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  for (const { method, path } of guarded) {
    test(`${method} ${path} is 401`, async ({ request }) => {
      const response =
        method === 'GET' ? await request.get(path) : await request.post(path)
      expect(response.status()).toBe(401)
      expect(await response.json()).toHaveProperty('error', 'Unauthorized')
    })
  }
})

test.describe('signed in', () => {
  for (const { method, path } of guarded) {
    test(`${method} ${path} passes the auth gate`, async ({ request }) => {
      const response =
        method === 'GET' ? await request.get(path) : await request.post(path)
      expect(response.status()).not.toBe(401)
    })
  }

  test('stats endpoints return the seeded totals', async ({ request }) => {
    const overview = await request.get('/api/stats/overview?limit=3')
    expect(overview.status()).toBe(200)
    const body = await overview.json()
    expect(body.totals.totalPlays).toBeGreaterThan(0)
    expect(body.topArtists).toHaveLength(3)
    expect(body.topTracks).toHaveLength(3)

    const recent = await request.get('/api/stats/recent?limit=5')
    expect(recent.status()).toBe(200)
    expect((await recent.json()).items).toHaveLength(5)
  })

  test('playlists endpoint returns the mock catalog', async ({ request }) => {
    const response = await request.get('/api/spotify/playlists')
    expect(response.status()).toBe(200)
    const items = (await response.json()).items ?? (await response.json())
    expect(items.length).toBeGreaterThan(0)
  })

  test('background sync status answers with the sync shape', async ({
    request,
  }) => {
    const response = await request.get('/api/spotify/background-sync-status')
    expect(response.status()).toBe(200)
    expect(await response.json()).toMatchObject({
      isRunning: expect.any(Boolean),
    })
  })
})
