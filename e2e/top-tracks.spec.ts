import { expect, test } from "@playwright/test"
import { mainHeading, waitForContent } from "./helpers.ts"

test("lists top tracks with show-all toggle", async ({ page }) => {
  await page.goto("/top-tracks")
  await waitForContent(page)

  const rows = page.locator("tbody tr")
  await expect(rows).toHaveCount(20)
  await expect(rows.first()).toContainText("Northern Static")
  // Durations stay on one line.
  await expect(rows.first().locator("td").last()).toHaveCSS("white-space", "nowrap")

  const toggle = page.getByRole("button", { name: /Show all \d+/ })
  await toggle.click()
  expect(await rows.count()).toBeGreaterThan(20)
  await page.getByRole("button", { name: "Show top 20" }).click()
  await expect(rows).toHaveCount(20)
})

test("track detail page shows stats and links back", async ({ page }) => {
  await page.goto("/top-tracks")
  await waitForContent(page)
  await page.locator("tbody tr").first().getByRole("link").first().click()

  await expect(mainHeading(page)).toHaveText("Northern Static")
  await expect(page.getByText("#1 track · 30 Days")).toBeVisible()
  await waitForContent(page)
  await expect(page.getByText("Play frequency")).toBeVisible()
  await expect(page.getByText(/Times played per day · 30 Days/)).toBeVisible()
  await expect(page.getByText("Usually played")).toBeVisible()
  // Raw source ids are humanized.
  await expect(page.getByText("spotify-recent")).toHaveCount(0)

  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "Top Tracks" }).click()
  await expect(mainHeading(page)).toHaveText("Top Tracks")
})

test("artist column links to the artist", async ({ page }) => {
  await page.goto("/top-tracks")
  await waitForContent(page)
  await page.locator("tbody tr").nth(1).getByRole("link", { name: "The Violet Hours" }).click()
  await expect(mainHeading(page)).toHaveText("The Violet Hours")
})
