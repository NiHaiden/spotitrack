import { expect, test } from '@playwright/test'
import { waitForContent } from './helpers.ts'
import type { Page } from '@playwright/test'
import type { StatsOverview } from '../src/lib/spotify-query-options'

function statCard(page: Page, label: string) {
  return page.getByRole('group', { name: label, exact: true })
}

test('stat cards match the overview API', async ({ page }) => {
  const overviewResponse = page.waitForResponse(
    (r) => r.url().includes('/api/stats/overview') && r.ok(),
  )
  await page.goto('/dashboard')
  // SSR loads the first overview; switching range forces a client fetch we can read.
  await page.getByRole('button', { name: 'Select 7 days range' }).click()
  const overview = (await (await overviewResponse).json()) as StatsOverview
  await waitForContent(page)

  await expect(statCard(page, 'Plays')).toContainText(
    overview.totals.totalPlays.toLocaleString(),
  )
  await expect(statCard(page, 'Artists')).toContainText(
    String(overview.totals.uniqueArtists),
  )
  await expect(statCard(page, 'Unique tracks')).toContainText(
    String(overview.totals.uniqueTracks),
  )
  await expect(page.getByText('Time per day · 7 days')).toBeVisible()
})

test('range selector updates subtitle and pressed state', async ({ page }) => {
  await page.goto('/dashboard')
  await waitForContent(page)
  const allTime = page.getByRole('button', { name: 'Select All time range' })
  await allTime.click()
  await expect(allTime).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Time per day · All time')).toBeVisible()
})

test('highlights link through to detail pages', async ({ page }) => {
  await page.goto('/dashboard')
  await waitForContent(page)

  await expect(page.getByText('Top artist', { exact: true })).toBeVisible()
  await page
    .getByRole('link', { name: /Aurora Lane/ })
    .first()
    .click()
  await expect(
    page.getByRole('main').getByRole('heading', { level: 1 }),
  ).toHaveText('Aurora Lane')
})

test('charts render with data', async ({ page }) => {
  await page.goto('/dashboard')
  await waitForContent(page)
  await expect(page.locator('.recharts-area-area')).toHaveCount(1)
  await expect(
    page.locator('.recharts-bar-rectangle path').first(),
  ).toBeVisible()
  await expect(page.getByText(/busiest around \d+ (AM|PM)/)).toBeVisible()
})

test('recent history lists the latest plays', async ({ page }) => {
  await page.goto('/dashboard')
  await waitForContent(page)
  const recent = page.locator('section').filter({ hasText: 'Recent history' })
  await expect(recent.getByRole('listitem')).toHaveCount(6)
})

test('the headline reads out the day under the pointer', async ({ page }) => {
  await page.goto('/dashboard')
  await waitForContent(page)
  const headline = page.getByText(/^Time listened · 30 days$/)
  await expect(headline).toBeVisible()

  const chart = page.locator('.recharts-wrapper').first()
  const box = (await chart.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect(headline).toHaveCount(0)
  await expect(
    page.getByText(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \w+ \d+$/),
  ).toBeVisible()

  await page.mouse.move(box.x + box.width / 2, box.y - 200)
  await expect(headline).toBeVisible()
})
