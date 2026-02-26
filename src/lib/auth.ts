import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/db"
import * as schema from "@/db/schema"

const isProduction = process.env.NODE_ENV === "production"

if (isProduction && !process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET must be set in production")
}

function isValidOrigin(origin: string) {
  try {
    const url = new URL(origin)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const trustedOrigins = Array.from(
  new Set([
    process.env.BETTER_AUTH_URL,
    process.env.VITE_BETTER_AUTH_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
      ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map(v => v.trim())
      : []),
  ]),
).filter((origin): origin is string => Boolean(origin && isValidOrigin(origin)))

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  defaultCookieAttributes: {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isProduction,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 12,
  },
  socialProviders: {
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      redirectURI:
        process.env.SPOTIFY_REDIRECT_URI ||
        "http://127.0.0.1:3000/api/auth/callback/spotify",
      scope: [
        "user-read-email",
        "user-read-private",
        "user-top-read",
        "user-read-recently-played",
        "playlist-read-private",
        "playlist-read-collaborative",
      ],
    },
  },
  plugins: [tanstackStartCookies()],
  trustedOrigins,
  useSecureCookies: isProduction,
})
