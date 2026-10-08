import { expect, test } from "@playwright/test"
import { waitForContent } from "./helpers.ts"
import type { Page } from "@playwright/test"
import type { StatsOverview } from "../src/lib/spotify-query-options"

function statCard(page: Page, label: string) {
  return page.getByRole("group", { name: label, exact: true })
}

test("stat cards match the overview API", async ({ page }) => {
  const overviewResponse = page.waitForResponse(
    r => r.url().includes("/api/stats/overview") && r.ok(),
  )
  await page.goto("/dashboard")
  // SSR loads the first overview; switching range forces a client fetch we can read.
  await page.getByRole("button", { name: "Select 7 Days range" }).click()
  const overview = (await (await overviewResponse).json()) as StatsOverview
  await waitForContent(page)

  await expect(statCard(page, "Plays")).toContainText(overview.totals.totalPlays.toLocaleString())
  await expect(statCard(page, "Artists")).toContainText(String(overview.totals.uniqueArtists))
  await expect(statCard(page, "Unique tracks")).toContainText(String(overview.totals.uniqueTracks))
  await expect(page.getByText("Time per day · 7 Days")).toBeVisible()
})

test("range selector updates subtitle and pressed state", async ({ page }) => {
  await page.goto("/dashboard")
  await waitForContent(page)
  const allTime = page.getByRole("button", { name: "Select All Time range" })
  await allTime.click()
  await expect(allTime).toHaveAttribute("aria-pressed", "true")
  await expect(page.getByText("Time per day · All Time")).toBeVisible()
})

test("highlights link through to detail pages", async ({ page }) => {
  await page.goto("/dashboard")
  await waitForContent(page)

  await expect(page.getByText("Top artist", { exact: true })).toBeVisible()
  await page.getByRole("link", { name: /Aurora Lane/ }).first().click()
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toHaveText("Aurora Lane")
})

test("charts render with data", async ({ page }) => {
  await page.goto("/dashboard")
  await waitForContent(page)
  await expect(page.locator(".recharts-area-area")).toHaveCount(1)
  await expect(page.locator(".recharts-bar-rectangle path").first()).toBeVisible()
  await expect(page.getByText(/busiest around \d+ (AM|PM)/)).toBeVisible()
})

test("recent history lists the latest plays", async ({ page }) => {
  await page.goto("/dashboard")
  await waitForContent(page)
  const recent = page.locator("section").filter({ hasText: "Recent history" })
  await expect(recent.getByRole("listitem")).toHaveCount(6)
})
