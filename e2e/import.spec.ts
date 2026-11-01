import { expect, test } from '@playwright/test'
import { waitForContent } from './helpers.ts'

// Spotify privacy exports come in two shapes. The extended one (`ts` with
// seconds, plus an optional track uri) is what the importer resolves against
// the Spotify API, so it is the one exercised here.
const secondsAgo = (seconds: number) =>
  new Date(Date.now() - seconds * 1000).toISOString()

function extendedEntry(
  name: string,
  artist: string,
  seconds: number,
  options: { msPlayed?: number; trackUri?: string | null } = {},
) {
  return {
    ts: secondsAgo(seconds),
    ms_played: options.msPlayed ?? 180_000,
    spotify_track_uri: options.trackUri ?? null,
    master_metadata_track_name: name,
    master_metadata_album_artist_name: artist,
  }
}

const importedTrackName = 'Imported Signal'

// Three rows survive normalization: one resolved by search, one resolved by
// spotify_track_uri, one kept under its raw export name. The fourth is under
// the 5s floor and must be dropped.
const entries = [
  extendedEntry('Northern Static', 'Aurora Lane', 300),
  extendedEntry(importedTrackName, 'Aurora Lane', 240),
  extendedEntry('Glasshouse', 'Aurora Lane', 180, {
    trackUri: 'spotify:track:tr-aurora-1',
  }),
  extendedEntry('Imported Skip', 'Aurora Lane', 120, { msPlayed: 1_200 }),
]

const file = {
  name: 'StreamingHistory0.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify(entries)),
}

test('imports a streaming-history export and lists the plays', async ({
  page,
}) => {
  await page.goto('/recent')
  await waitForContent(page)

  await page.locator('button[aria-expanded]', { hasText: 'Import' }).click()
  await page.locator('input[type="file"]').setInputFiles(file)
  await expect(page.getByText('StreamingHistory0.json')).toBeVisible()

  await page.getByRole('button', { name: 'Import 1 file' }).click()
  await expect(page.getByRole('status')).toHaveText(
    'Import finished. Inserted 3/3 plays, resolved 2 tracks.',
  )

  // The panel closes itself and the new play shows up with an Import badge.
  await expect(page.getByText('Import Spotify privacy data')).toHaveCount(0)
  const row = page
    .getByRole('main')
    .getByRole('listitem')
    .filter({ hasText: importedTrackName })
  await expect(row).toHaveCount(1)
  await expect(row.getByText('Import', { exact: true })).toBeVisible()

  // Re-importing the same file must not duplicate anything.
  await page.locator('button[aria-expanded]', { hasText: 'Import' }).click()
  await page.locator('input[type="file"]').setInputFiles(file)
  await page.getByRole('button', { name: 'Import 1 file' }).click()
  await expect(page.getByRole('status')).toHaveText(
    'Import finished. Inserted 0/3 plays, resolved 2 tracks.',
  )
  await expect(
    page
      .getByRole('main')
      .getByRole('listitem')
      .filter({ hasText: importedTrackName }),
  ).toHaveCount(1)
})

test.describe('import API', () => {
  test('rejects an empty payload', async ({ request }) => {
    const response = await request.post('/api/imports/spotify', {
      data: { entries: [] },
    })
    expect(response.status()).toBe(400)
    expect((await response.json()).error).toMatch(/no import entries/i)
  })

  test('rejects a file with no usable rows', async ({ request }) => {
    const response = await request.post('/api/imports/spotify', {
      multipart: {
        imports: {
          name: 'empty.json',
          mimeType: 'application/json',
          buffer: Buffer.from('[]'),
        },
      },
    })
    expect(response.status()).toBe(400)
  })

  test('rejects malformed JSON with a 500 instead of a crash', async ({
    request,
  }) => {
    const response = await request.post('/api/imports/spotify', {
      multipart: {
        imports: {
          name: 'broken.json',
          mimeType: 'application/json',
          buffer: Buffer.from('{oops'),
        },
      },
    })
    expect(response.status()).toBe(500)
    expect((await response.json()).error).toBeTruthy()
  })
})

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('import endpoints reject anonymous callers', async ({ request }) => {
    const json = await request.post('/api/imports/spotify', {
      data: { entries },
    })
    expect(json.status()).toBe(401)

    const list = await request.get('/api/imports')
    expect(list.status()).toBe(401)
  })
})
