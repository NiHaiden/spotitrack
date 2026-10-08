import { expect, test } from "@playwright/test"
import { testUser } from "./fixtures.ts"

test("shows account details and version", async ({ page }) => {
  await page.goto("/settings")
  const main = page.getByRole("main")
  await expect(main.getByText(testUser.name)).toBeVisible()
  await expect(main.getByText(testUser.email)).toBeVisible()
  await expect(main.getByText("Connected", { exact: true })).toBeVisible()
})

test("dark mode toggle applies and persists", async ({ page }) => {
  await page.goto("/settings")
  const html = page.locator("html")
  await expect(html).not.toHaveClass(/dark/)

  await page.getByRole("switch", { name: "Dark mode" }).click()
  await expect(html).toHaveClass(/dark/)

  await expect
    .poll(async () => (await page.context().cookies()).find(c => c.name === "_preferred-theme")?.value)
    .toBe("dark")
  await page.reload()
  await expect(html).toHaveClass(/dark/)
  await expect(page.getByRole("switch", { name: "Dark mode" })).toBeChecked()
})
