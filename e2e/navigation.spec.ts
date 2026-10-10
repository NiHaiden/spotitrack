import { expect, test } from "@playwright/test"
import { expectNoHorizontalOverflow, mainHeading, waitForContent } from "./helpers.ts"

const sections = [
  { link: "Dashboard", path: "/dashboard", heading: /Welcome back, Robin/ },
  { link: "Top Tracks", path: "/top-tracks", heading: "Top Tracks" },
  { link: "Top Artists", path: "/top-artists", heading: "Top Artists" },
  { link: "Recent Plays", path: "/recent", heading: "Recent Plays" },
  { link: "Playlists", path: "/playlists", heading: "Playlists" },
  { link: "Settings", path: "/settings", heading: /Settings/ },
]

test("sidebar navigates between every section", async ({ page, isMobile }) => {
  await page.goto("/dashboard")
  await waitForContent(page)

  for (const section of sections) {
    if (isMobile) {
      await page.getByRole("button", { name: "Open navigation" }).click()
    }
    const nav = page.locator('[data-sidebar="sidebar"]').filter({ visible: true })
    await nav.getByRole("link", { name: section.link, exact: true }).click()

    await expect(page).toHaveURL(new RegExp(`${section.path}$`))
    await expect(mainHeading(page)).toHaveText(section.heading)
    await waitForContent(page)
    await expectNoHorizontalOverflow(page)
  }
})

test("brand is spelled correctly", async ({ page, isMobile }) => {
  await page.goto("/dashboard")
  if (isMobile) {
    await expect(page.locator("header").getByText("SpotiTrack")).toBeVisible()
  } else {
    await expect(page.locator('[data-sidebar="sidebar"]').getByText("SpotiTrack")).toBeVisible()
  }
  await expect(page.getByText("SpotTrack")).toHaveCount(0)
})

for (const path of [
  "/top-artists/Aurora%2520Lane",
  "/top-tracks/Northern%2520Static?artist=Aurora%20Lane",
  "/playlists/pl-night",
]) {
  test(`detail page ${path} fits the viewport`, async ({ page }) => {
    await page.goto(path)
    await waitForContent(page)
    await expect(mainHeading(page)).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
}
