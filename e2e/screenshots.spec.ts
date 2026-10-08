import path from "node:path"
import { expect, test } from "@playwright/test"
import type { Page } from "@playwright/test"

// Captures every major screen in light + dark, desktop + mobile.
// Output: e2e/screenshots/<theme>-<viewport>-<name>.png
const OUT_DIR =
  process.env.SCREENSHOT_DIR ?? path.join(import.meta.dirname, "screenshots")

const pages = [
  { name: "dashboard", url: "/dashboard" },
  { name: "top-tracks", url: "/top-tracks" },
  { name: "top-artists", url: "/top-artists" },
  { name: "artist-detail", url: `/top-artists/${encodeURIComponent(encodeURIComponent("Aurora Lane"))}` },
  { name: "track-detail", url: `/top-tracks/${encodeURIComponent(encodeURIComponent("Northern Static"))}?artist=Aurora%20Lane` },
  { name: "recent", url: "/recent" },
  { name: "playlists", url: "/playlists" },
  { name: "playlist-detail", url: "/playlists/pl-night" },
  { name: "settings", url: "/settings" },
]

async function settle(page: Page) {
  await page.waitForLoadState("networkidle")
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 })
}

/**
 * Full-page screenshots resize the viewport mid-capture, which restarts the
 * recharts entry animation. Grow the viewport to the page height first and let
 * the charts settle, then take a plain screenshot.
 */
async function capture(page: Page, file: string) {
  const viewport = page.viewportSize()!
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  await page.setViewportSize({ width: viewport.width, height: Math.max(height, viewport.height) })
  await page.waitForTimeout(1_800)
  await page.screenshot({ path: file })
}

for (const theme of ["light", "dark"] as const) {
  for (const viewport of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test.describe(`${theme} ${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } })

      test.beforeEach(async ({ context, baseURL }) => {
        await context.addCookies([
          { name: "_preferred-theme", value: theme, url: baseURL! },
        ])
      })

      for (const { name, url } of pages) {
        test(name, async ({ page }) => {
          await page.goto(url)
          await settle(page)
          await capture(page, path.join(OUT_DIR, `${theme}-${viewport.name}-${name}.png`))
        })
      }
    })
  }
}

test("sign-in", async ({ browser, baseURL }) => {
  for (const theme of ["light", "dark"] as const) {
    const context = await browser.newContext({ storageState: undefined, viewport: { width: 1440, height: 900 } })
    await context.addCookies([{ name: "_preferred-theme", value: theme, url: baseURL! }])
    const page = await context.newPage()
    await page.goto("/sign-in")
    await page.waitForLoadState("networkidle")
    await page.screenshot({ path: path.join(OUT_DIR, `${theme}-desktop-sign-in.png`) })
    await context.close()
  }
})
