import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { db } from "@/db"
import * as schema from "@/db/schema"

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.VITE_BETTER_AUTH_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS
    ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map(v => v.trim())
    : []),
].filter((v): v is string => Boolean(v))

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  socialProviders: {
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      redirectURI: process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:3000/api/auth/callback/spotify",
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
})
