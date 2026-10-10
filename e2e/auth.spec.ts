import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import postgres from "postgres"
import {
  E2E_APP_URL,
  E2E_DATABASE_URL,
  SESSION_COOKIE,
  signCookieValue,
  testUser,
} from "./fixtures.ts"

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("protected pages redirect to sign-in and keep the target", async ({ page }) => {
    await page.goto("/top-tracks")
    await expect(page).toHaveURL(/\/sign-in\?redirect=%2Ftop-tracks/)
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Continue with Spotify" })).toBeEnabled()
  })

  test("API rejects unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/stats/overview")
    expect(response.status()).toBe(401)
  })
})

test("signed-in users skip the sign-in page", async ({ page }) => {
  await page.goto("/sign-in")
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto("/")
  await expect(page).toHaveURL(/\/dashboard$/)
})

test.describe("sign out", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  // Mints a throwaway session so signing out never invalidates the shared one.
  test("from settings returns to sign-in and ends the session", async ({ page, context }) => {
    const token = `e2e-signout-${randomUUID()}`
    const sql = postgres(E2E_DATABASE_URL, { max: 1 })
    try {
      await sql`
        insert into session (id, expires_at, token, user_id)
        values (${token}, ${new Date(Date.now() + 3_600_000).toISOString()}, ${token}, ${testUser.id})
      `
    } finally {
      await sql.end()
    }
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: signCookieValue(token),
        url: E2E_APP_URL,
        httpOnly: true,
        sameSite: "Lax",
      },
    ])

    await page.goto("/settings")
    await page.getByRole("main").getByRole("button", { name: "Sign out" }).click()
    await expect(page).toHaveURL(/\/sign-in/)

    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
