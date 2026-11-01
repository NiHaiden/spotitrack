import { expect, test } from '@playwright/test'

test('unknown route renders the not-found page', async ({ page }) => {
  await page.goto('/definitely-not-a-page')
  await expect(page.getByText('Page not found.')).toBeVisible()
})

test('unknown route under a valid prefix still 404s', async ({ page }) => {
  await page.goto('/top-tracks/does/not/exist/deep')
  await expect(page.getByText('Page not found.')).toBeVisible()
})

test('unknown API route does not fall through to the app', async ({
  request,
}) => {
  const response = await request.get('/api/definitely-not-an-endpoint')
  expect(response.status()).toBe(404)
})
