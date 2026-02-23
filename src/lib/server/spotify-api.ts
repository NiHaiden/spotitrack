import { and, eq } from "drizzle-orm"
import { db } from "@/db"
import { account } from "@/db/schema"

const SPOTIFY_API_BASE = "https://api.spotify.com/v1"
const SPOTIFY_ACCOUNTS_BASE = "https://accounts.spotify.com"

type SpotifyRefreshResponse = {
  access_token: string
  token_type: string
  scope?: string
  expires_in: number
  refresh_token?: string
}

export class SpotifyAuthError extends Error {
  status: number

  constructor(message: string, status = 401) {
    super(message)
    this.status = status
  }
}

async function getSpotifyAccountForUser(userId: string) {
  const rows = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")))
    .limit(1)

  return rows[0] ?? null
}

async function refreshSpotifyToken(userId: string, refreshToken: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new SpotifyAuthError(
      "Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET",
      500,
    )
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  })

  const response = await fetch(`${SPOTIFY_ACCOUNTS_BASE}/api/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new SpotifyAuthError(
      `Could not refresh Spotify token: ${errorText}`,
      response.status,
    )
  }

  const payload = (await response.json()) as SpotifyRefreshResponse
  const expiresAt = new Date(Date.now() + payload.expires_in * 1000)

  await db
    .update(account)
    .set({
      accessToken: payload.access_token,
      accessTokenExpiresAt: expiresAt,
      refreshToken: payload.refresh_token ?? refreshToken,
      scope: payload.scope,
      updatedAt: new Date(),
    })
    .where(and(eq(account.userId, userId), eq(account.providerId, "spotify")))

  return payload.access_token
}

export async function getSpotifyAccessTokenForUser(userId: string) {
  const spotifyAccount = await getSpotifyAccountForUser(userId)

  if (!spotifyAccount) {
    throw new SpotifyAuthError("Spotify account is not connected", 404)
  }

  if (!spotifyAccount.accessToken) {
    throw new SpotifyAuthError("No Spotify access token available", 401)
  }

  const expiresAt = spotifyAccount.accessTokenExpiresAt
  const stillValid =
    expiresAt && expiresAt.getTime() - Date.now() > 60 * 1000

  if (stillValid) {
    return spotifyAccount.accessToken
  }

  if (!spotifyAccount.refreshToken) {
    throw new SpotifyAuthError("Spotify refresh token is missing", 401)
  }

  return refreshSpotifyToken(userId, spotifyAccount.refreshToken)
}

type QueryPrimitive = string | number | boolean | null | undefined

type QueryParams = Record<string, QueryPrimitive>

function withQuery(pathname: string, query?: QueryParams) {
  const url = new URL(`${SPOTIFY_API_BASE}/${pathname}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

export async function spotifyGet<T>(
  token: string,
  pathname: string,
  query?: QueryParams,
): Promise<T> {
  const response = await fetch(withQuery(pathname, query), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new SpotifyAuthError(
      `Spotify API request failed (${response.status}): ${text}`,
      response.status,
    )
  }

  return (await response.json()) as T
}

export async function spotifyGetWithAutoRefresh<T>(
  userId: string,
  pathname: string,
  query?: QueryParams,
): Promise<T> {
  try {
    const token = await getSpotifyAccessTokenForUser(userId)
    return await spotifyGet<T>(token, pathname, query)
  } catch (error) {
    if (error instanceof SpotifyAuthError && error.status === 401) {
      const accountRow = await getSpotifyAccountForUser(userId)
      if (!accountRow?.refreshToken) {
        throw error
      }
      const refreshed = await refreshSpotifyToken(userId, accountRow.refreshToken)
      return spotifyGet<T>(refreshed, pathname, query)
    }

    throw error
  }
}
