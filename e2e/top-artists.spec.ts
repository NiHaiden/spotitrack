import { expect, test } from "@playwright/test"
import { mainHeading, waitForContent } from "./helpers.ts"

test("shows the #1 artist hero and a ranked grid", async ({ page }) => {
  await page.goto("/top-artists")
  await waitForContent(page)

  const hero = page.getByRole("link", { name: /#1 artist Aurora Lane/i })
  await expect(hero).toContainText(/\d+ plays/)
  await expect(page.getByRole("link", { name: /^02 The Violet Hours/ })).toBeVisible()

  // Artist without an image falls back to an initial.
  await expect(page.getByRole("link", { name: /Quiet Machines/ })).toContainText("Q")
})

test("artist detail shows breakdown and top tracks", async ({ page }) => {
  await page.goto("/top-artists")
  await waitForContent(page)
  await page.getByRole("link", { name: /Kepler Drive/ }).click()

  await expect(mainHeading(page)).toHaveText("Kepler Drive")
  await waitForContent(page)
  await expect(page.getByText("Listening breakdown")).toBeVisible()
  await expect(page.getByText("Peak hour")).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Top tracks by Kepler Drive" })).toBeVisible()
  await expect(page.locator("tbody tr")).toHaveCount(3)
})

test("empty range shows an empty state", async ({ page }) => {
  await page.goto(`/top-artists/${encodeURIComponent(encodeURIComponent("Nobody Here"))}`)
  await waitForContent(page)
  await expect(page.getByText("No plays of Nobody Here in this range")).toBeVisible()
})
