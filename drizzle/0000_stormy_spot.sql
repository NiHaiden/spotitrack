CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "spotify_album" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"release_date" text,
	"images" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotify_artist" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"genres" jsonb,
	"popularity" integer,
	"images" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotify_import" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotify_play" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"track_id" text,
	"track_name" text NOT NULL,
	"artist_name" text NOT NULL,
	"played_at" timestamp with time zone NOT NULL,
	"ms_played" integer NOT NULL,
	"source" text DEFAULT 'spotify-api' NOT NULL,
	"import_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotify_track" (
	"id" text PRIMARY KEY NOT NULL,
	"album_id" text,
	"name" text NOT NULL,
	"duration_ms" integer,
	"explicit" boolean,
	"popularity" integer,
	"preview_url" text,
	"uri" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spotify_track_artist" (
	"track_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "spotify_track_artist_track_id_artist_id_pk" PRIMARY KEY("track_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_import" ADD CONSTRAINT "spotify_import_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_play" ADD CONSTRAINT "spotify_play_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_play" ADD CONSTRAINT "spotify_play_track_id_spotify_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."spotify_track"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_play" ADD CONSTRAINT "spotify_play_import_id_spotify_import_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."spotify_import"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_track" ADD CONSTRAINT "spotify_track_album_id_spotify_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."spotify_album"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_track_artist" ADD CONSTRAINT "spotify_track_artist_track_id_spotify_track_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."spotify_track"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spotify_track_artist" ADD CONSTRAINT "spotify_track_artist_artist_id_spotify_artist_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."spotify_artist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_provider_id_idx" ON "account" USING btree ("provider_id");--> statement-breakpoint
CREATE UNIQUE INDEX "account_provider_account_uidx" ON "account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spotify_import_user_id_idx" ON "spotify_import" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "spotify_import_status_idx" ON "spotify_import" USING btree ("status");--> statement-breakpoint
CREATE INDEX "spotify_play_user_played_at_idx" ON "spotify_play" USING btree ("user_id","played_at");--> statement-breakpoint
CREATE INDEX "spotify_play_track_id_idx" ON "spotify_play" USING btree ("track_id");--> statement-breakpoint
CREATE INDEX "spotify_play_import_id_idx" ON "spotify_play" USING btree ("import_id");--> statement-breakpoint
CREATE UNIQUE INDEX "spotify_play_user_dedupe_uidx" ON "spotify_play" USING btree ("user_id","played_at","track_name","artist_name");--> statement-breakpoint
CREATE INDEX "spotify_track_album_id_idx" ON "spotify_track" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "spotify_track_artist_artist_idx" ON "spotify_track_artist" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "spotify_track_artist_track_idx" ON "spotify_track_artist" USING btree ("track_id");