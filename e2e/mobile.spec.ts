import { expect, test } from '@playwright/test'
import { waitForContent } from './helpers.ts'

// The range selector renders two variants; these cover the dropdown one, which
// the desktop project never sees.

test('range dropdown changes the top tracks list', async ({ page }) => {
  await page.goto('/top-tracks')
  await waitForContent(page)

  // The inline desktop buttons are not reachable at phone width.
  await expect(page.getByRole('group', { name: 'Time range' })).toBeHidden()

  // The aria-label changes with the selection, so match it loosely.
  const trigger = page.getByRole('button', { name: /^Time range: / })
  await expect(trigger).toBeVisible()

  await trigger.click()
  await page.getByRole('menuitem', { name: '7 days' }).click()
  await expect(page.getByText('Your most played songs · 7 days')).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-label', 'Time range: 7 days')
  await waitForContent(page)
  await expect(page.locator('tbody tr').first()).toBeVisible()
})

test('range dropdown carries the current selection on every page', async ({
  page,
}) => {
  await page.goto('/top-artists')
  await waitForContent(page)
  await expect(
    page.getByRole('button', { name: 'Time range: 30 days' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Time range: 30 days' }).click()
  await page.getByRole('menuitem', { name: 'All time' }).click()
  await expect(
    page.getByText('Artists you listen to the most, all time'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Time range: All time' }).click()
  await expect(page.getByRole('menuitem', { name: 'All time' })).toBeVisible()
})
