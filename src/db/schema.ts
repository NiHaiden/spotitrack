import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

/**
 * Better Auth tables
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  table => [index("session_user_id_idx").on(table.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  table => [
    index("account_user_id_idx").on(table.userId),
    index("account_provider_id_idx").on(table.providerId),
    uniqueIndex("account_provider_account_uidx").on(
      table.providerId,
      table.accountId,
    ),
  ],
)

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

/**
 * Spotify tracking tables
 */
export const spotifyImport = pgTable(
  "spotify_import",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    status: text("status").notNull().default("processing"),
    totalRows: integer("total_rows").notNull().default(0),
    processedRows: integer("processed_rows").notNull().default(0),
    metadata: jsonb("metadata"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [
    index("spotify_import_user_id_idx").on(table.userId),
    index("spotify_import_status_idx").on(table.status),
  ],
)

export const spotifyArtist = pgTable("spotify_artist", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  genres: jsonb("genres"),
  popularity: integer("popularity"),
  images: jsonb("images"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const spotifyAlbum = pgTable("spotify_album", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  releaseDate: text("release_date"),
  images: jsonb("images"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const spotifyTrack = pgTable(
  "spotify_track",
  {
    id: text("id").primaryKey(),
    albumId: text("album_id").references(() => spotifyAlbum.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    durationMs: integer("duration_ms"),
    explicit: boolean("explicit"),
    popularity: integer("popularity"),
    previewUrl: text("preview_url"),
    uri: text("uri"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [index("spotify_track_album_id_idx").on(table.albumId)],
)

export const spotifyTrackArtist = pgTable(
  "spotify_track_artist",
  {
    trackId: text("track_id")
      .notNull()
      .references(() => spotifyTrack.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => spotifyArtist.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  table => [
    primaryKey({ columns: [table.trackId, table.artistId] }),
    index("spotify_track_artist_artist_idx").on(table.artistId),
    index("spotify_track_artist_track_idx").on(table.trackId),
  ],
)

export const spotifyPlay = pgTable(
  "spotify_play",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackId: text("track_id").references(() => spotifyTrack.id, {
      onDelete: "set null",
    }),
    trackName: text("track_name").notNull(),
    artistName: text("artist_name").notNull(),
    playedAt: timestamp("played_at", { withTimezone: true }).notNull(),
    msPlayed: integer("ms_played").notNull(),
    source: text("source").notNull().default("spotify-api"),
    importId: text("import_id").references(() => spotifyImport.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  table => [
    index("spotify_play_user_played_at_idx").on(table.userId, table.playedAt),
    index("spotify_play_track_id_idx").on(table.trackId),
    index("spotify_play_import_id_idx").on(table.importId),
    uniqueIndex("spotify_play_user_dedupe_uidx").on(
      table.userId,
      table.playedAt,
      table.trackName,
      table.artistName,
    ),
  ],
)
