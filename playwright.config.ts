import { defineConfig, devices } from "@playwright/test"
import {
  E2E_APP_PORT,
  E2E_APP_URL,
  E2E_AUTH_SECRET,
  E2E_DATABASE_URL,
  E2E_MOCK_URL,
} from "./e2e/fixtures.ts"

const STORAGE_STATE = "e2e/.auth/user.json"

// The built server runs with NODE_ENV=production, wired to a seeded Postgres
// database and a local mock of the Spotify API.
const serverEnv = {
  PORT: String(E2E_APP_PORT),
  HOST: "127.0.0.1",
  DATABASE_URL: E2E_DATABASE_URL,
  BETTER_AUTH_URL: E2E_APP_URL,
  BETTER_AUTH_SECRET: E2E_AUTH_SECRET,
  SPOTIFY_CLIENT_ID: "e2e-client-id",
  SPOTIFY_CLIENT_SECRET: "e2e-client-secret",
  SPOTIFY_REDIRECT_URI: `${E2E_APP_URL}/api/auth/callback/spotify`,
  SPOTIFY_API_BASE_URL: `${E2E_MOCK_URL}/v1`,
  SPOTIFY_ACCOUNTS_BASE_URL: E2E_MOCK_URL,
  TZ: "UTC",
}

const shared = {
  timezoneId: "UTC",
  locale: "en-US",
}

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: E2E_APP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: /screenshots\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        ...shared,
        viewport: { width: 1440, height: 900 },
        storageState: STORAGE_STATE,
      },
    },
    {
      name: "mobile",
      testMatch: /(navigation|mobile)\.spec\.ts/,
      use: {
        ...devices["Pixel 7"],
        ...shared,
        storageState: STORAGE_STATE,
      },
    },
    {
      // Not part of the default run: `pnpm e2e:screenshots`
      name: "screenshots",
      testMatch: /screenshots\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        ...shared,
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        storageState: STORAGE_STATE,
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-spotify.ts",
      url: `${E2E_MOCK_URL}/health`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: process.env.E2E_SKIP_BUILD
        ? "node .output/server/index.mjs"
        : "pnpm build && node .output/server/index.mjs",
      url: `${E2E_APP_URL}/sign-in`,
      env: serverEnv,
      timeout: 240_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
