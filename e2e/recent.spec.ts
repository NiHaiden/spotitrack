import { expect, test } from "@playwright/test"
import { waitForContent } from "./helpers.ts"

test("groups plays by day and paginates", async ({ page }) => {
  await page.goto("/recent")
  await waitForContent(page)

  const items = page.getByRole("main").getByRole("listitem")
  await expect(items).toHaveCount(50)
  await expect(page.getByRole("main").getByText(/^\d+ plays? · /).first()).toBeVisible()
  await expect(page.getByText("Spotify", { exact: true }).first()).toBeVisible()
  await expect(page.getByText("Import", { exact: true }).first()).toBeVisible()

  await page.getByRole("button", { name: /Show more/ }).click()
  await expect(items).toHaveCount(100)
})

test("manual sync reports the result", async ({ page }) => {
  await page.goto("/recent")
  await waitForContent(page)
  await page.getByRole("button", { name: "Sync now" }).click()
  await expect(page.getByRole("status")).toHaveText(/Synced \d+ of \d+ recent plays/)
})

test("import panel toggles and requires files", async ({ page }) => {
  await page.goto("/recent")
  const toggle = page.locator("button[aria-expanded]", { hasText: "Import" })
  await toggle.click()
  await expect(toggle).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByText("Import Spotify privacy data")).toBeVisible()
  const panel = page.locator("section", { hasText: "Import Spotify privacy data" })
  await expect(panel.getByRole("button", { name: "Import", exact: true })).toBeDisabled()
})
