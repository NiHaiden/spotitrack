import { db } from "@/db"
import { account } from "@/db/schema"
import { eq } from "drizzle-orm"
import { syncRecentPlaysFromSpotify } from "@/lib/server/spotify-storage"

const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes
const STAGGER_DELAY_MS = 5_000 // 5s between users to avoid rate limits

function getSyncIntervalMs(): number {
  const env = process.env.SYNC_INTERVAL_MS
  if (env) {
    const parsed = Number(env)
    if (Number.isFinite(parsed) && parsed >= 30_000) {
      return parsed
    }
  }
  return DEFAULT_SYNC_INTERVAL_MS
}

let intervalHandle: ReturnType<typeof setInterval> | null = null

async function getAllSpotifyUserIds(): Promise<Array<string>> {
  const rows = await db
    .select({ userId: account.userId })
    .from(account)
    .where(eq(account.providerId, "spotify"))

  return [...new Set(rows.map((r) => r.userId))]
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function syncAllUsers() {
  let userIds: Array<string>
  try {
    userIds = await getAllSpotifyUserIds()
  } catch (err) {
    console.error("[sync-scheduler] Failed to query users:", err)
    return
  }

  if (userIds.length === 0) {
    return
  }

  console.log(
    `[sync-scheduler] Starting sync for ${String(userIds.length)} user(s)`,
  )

  for (const userId of userIds) {
    try {
      const result = await syncRecentPlaysFromSpotify(userId, 50)
      if (result.inserted > 0) {
        console.log(
          `[sync-scheduler] User ${userId}: synced ${String(result.inserted)}/${String(result.fetched)} plays`,
        )
      }
    } catch (err) {
      // Log but don't stop — continue with next user
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[sync-scheduler] User ${userId} failed: ${message}`)
    }

    // Stagger requests to stay within Spotify rate limits
    if (userIds.indexOf(userId) < userIds.length - 1) {
      await sleep(STAGGER_DELAY_MS)
    }
  }
}

export function startSyncScheduler() {
  if (intervalHandle) {
    return // Already running
  }

  const intervalMs = getSyncIntervalMs()

  console.log(
    `[sync-scheduler] Starting background sync (every ${String(intervalMs / 1000)}s)`,
  )

  // Run first sync after a short delay (let server finish starting)
  setTimeout(() => {
    void syncAllUsers()
  }, 10_000)

  // Then run on interval
  intervalHandle = setInterval(() => {
    void syncAllUsers()
  }, intervalMs)

  // Don't prevent process exit
  if (intervalHandle && typeof intervalHandle === "object" && "unref" in intervalHandle) {
    intervalHandle.unref()
  }
}

export function stopSyncScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
    console.log("[sync-scheduler] Stopped background sync")
  }
}
