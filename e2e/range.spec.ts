import { expect, test } from '@playwright/test'
import { waitForContent } from './helpers.ts'
import type { Page } from '@playwright/test'

const rangeButton = (page: Page, label: string) =>
  page.getByRole('button', { name: `Select ${label} range` })

/** Untruncate the table so row counts compare the whole result set. */
async function visibleRows(page: Page) {
  const showAll = page.getByRole('button', { name: /^Show all \d+/ })
  if (await showAll.count()) {
    await showAll.click()
  }
  await waitForContent(page)
  return page.locator('tbody tr').count()
}

test('top tracks table follows the selected range', async ({ page }) => {
  await page.goto('/top-tracks')
  await waitForContent(page)
  await expect(page.getByText('Your most played songs · 30 days')).toBeVisible()
  await expect(rangeButton(page, '30 days')).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  await rangeButton(page, 'All time').click()
  await expect(
    page.getByText('Your most played songs of all time'),
  ).toBeVisible()
  const allTime = await visibleRows(page)

  await rangeButton(page, '24h').click()
  await expect(rangeButton(page, '24h')).toHaveAttribute('aria-pressed', 'true')
  await expect(rangeButton(page, 'All time')).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.getByText('Your most played songs · 24h')).toBeVisible()

  const lastDay = await visibleRows(page)
  expect(lastDay).toBeGreaterThan(0)
  expect(lastDay).toBeLessThan(allTime)
})

test('top artists page follows the selected range', async ({ page }) => {
  await page.goto('/top-artists')
  await waitForContent(page)
  await expect(
    page.getByText('Artists you listen to the most · 30 days'),
  ).toBeVisible()

  await rangeButton(page, '6 months').click()
  await expect(
    page.getByText('Artists you listen to the most · 6 months'),
  ).toBeVisible()
  await expect(rangeButton(page, '6 months')).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await waitForContent(page)
  await expect(page.getByRole('link', { name: /#1 artist/i })).toBeVisible()

  await rangeButton(page, 'All time').click()
  await expect(
    page.getByText('Artists you listen to the most, all time'),
  ).toBeVisible()
})

test('track detail range selector is independent of the list page', async ({
  page,
}) => {
  await page.goto('/top-tracks')
  await waitForContent(page)
  await page.locator('tbody tr').first().getByRole('link').first().click()
  await expect(page.getByText('#1 track · 30 days')).toBeVisible()

  await rangeButton(page, 'All time').click()
  await waitForContent(page)
  await expect(page.getByText('#1 track · All time')).toBeVisible()

  await page.goBack()
  await waitForContent(page)
  // The list keeps its own range instead of inheriting the detail page's choice.
  await expect(page.getByText('Your most played songs · 30 days')).toBeVisible()
})
