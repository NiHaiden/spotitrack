import { expect } from "@playwright/test"
import type { Page } from "@playwright/test"

/** Waits until every loading skeleton on the page is gone. */
export async function waitForContent(page: Page) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0, { timeout: 15_000 })
}

/** Guards against layouts that overflow the viewport sideways (a past mobile bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(1)
}

export const mainHeading = (page: Page) => page.getByRole("main").getByRole("heading", { level: 1 })
