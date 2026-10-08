import { expect, test } from "@playwright/test"
import { mainHeading, waitForContent } from "./helpers.ts"

test("lists playlists from Spotify", async ({ page }) => {
  await page.goto("/playlists")
  await waitForContent(page)
  const cards = page.getByRole("main").getByRole("link")
  await expect(cards).toHaveCount(5)
  await expect(cards.filter({ hasText: "Night Drive" })).toContainText("8 tracks")

  await page.getByRole("button", { name: "Refresh" }).click()
  await expect(page.getByRole("button", { name: "Refresh" })).toBeEnabled()
})

test("playlist detail shows insights", async ({ page }) => {
  await page.goto("/playlists")
  await page.getByRole("link", { name: /Night Drive/ }).click()

  await expect(mainHeading(page)).toHaveText("Night Drive")
  await waitForContent(page)
  await expect(page.getByText("Playlist · 8 tracks")).toBeVisible()
  await expect(page.getByText("Tracks played", { exact: true })).toBeVisible()
  await expect(page.getByText("Tracks you've played")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Most played from this playlist" })).toBeVisible()
  await expect(page.locator("tbody tr")).toHaveCount(8)
})

test("empty playlist shows an empty state", async ({ page }) => {
  await page.goto("/playlists/pl-empty")
  await waitForContent(page)
  await expect(page.getByText("No tracked plays from this playlist yet")).toBeVisible()
})
