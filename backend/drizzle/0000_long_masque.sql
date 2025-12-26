CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"name" text,
	"description" text,
	"icon_url" text,
	"rarity_percentage" real,
	"points" integer,
	CONSTRAINT "achievements_game_id_platform_id_achievement_id_unique" UNIQUE("game_id","platform_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "collection_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	CONSTRAINT "collection_games_collection_id_game_id_unique" UNIQUE("collection_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_completion_times" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"main_story_hours" real,
	"main_extras_hours" real,
	"completionist_hours" real,
	"source" varchar(50),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "game_completion_times_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "game_genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"genre_id" uuid NOT NULL,
	CONSTRAINT "game_genres_game_id_genre_id_unique" UNIQUE("game_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rawg_id" integer,
	"igdb_id" integer,
	"name" text NOT NULL,
	"slug" text,
	"release_date" date,
	"description" text,
	"cover_art_url" text,
	"background_image_url" text,
	"metacritic_score" integer,
	"opencritic_score" real,
	"esrb_rating" varchar(50),
	"series_name" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "games_rawg_id_unique" UNIQUE("rawg_id")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"rawg_id" integer,
	CONSTRAINT "genres_name_unique" UNIQUE("name"),
	CONSTRAINT "genres_rawg_id_unique" UNIQUE("rawg_id")
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"platform_type" varchar(20),
	CONSTRAINT "platforms_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "psnprofiles_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"difficulty_rating" real,
	"trophy_count_bronze" integer,
	"trophy_count_silver" integer,
	"trophy_count_gold" integer,
	"trophy_count_platinum" integer,
	"average_completion_time_hours" real,
	"psnprofiles_url" text,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "psnprofiles_data_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"sync_started" timestamp with time zone NOT NULL,
	"sync_completed" timestamp with time zone,
	"status" varchar(20),
	"games_synced" integer DEFAULT 0,
	"achievements_synced" integer DEFAULT 0,
	"error_message" text,
	CONSTRAINT "sync_status_check" CHECK (status IN ('running', 'completed', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked" boolean DEFAULT false,
	"unlock_date" timestamp with time zone,
	CONSTRAINT "user_achievements_user_id_achievement_id_unique" UNIQUE("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_game_custom_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"estimated_completion_hours" real,
	"actual_playtime_hours" real,
	"completion_percentage" integer,
	"difficulty_rating" integer,
	"achievements_total" integer,
	"achievements_earned" integer,
	"replay_value" integer,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_game_custom_fields_user_id_game_id_platform_id_unique" UNIQUE("user_id","game_id","platform_id"),
	CONSTRAINT "completion_percentage_check" CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
	CONSTRAINT "difficulty_rating_check" CHECK (difficulty_rating >= 1 AND difficulty_rating <= 10),
	CONSTRAINT "replay_value_check" CHECK (replay_value >= 1 AND replay_value <= 5)
);
--> statement-breakpoint
CREATE TABLE "user_game_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'backlog',
	"completion_percentage" real DEFAULT 0,
	"user_rating" integer,
	"notes" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"is_favorite" boolean DEFAULT false,
	CONSTRAINT "user_game_progress_user_id_game_id_platform_id_unique" UNIQUE("user_id","game_id","platform_id"),
	CONSTRAINT "status_check" CHECK (status IN ('backlog', 'playing', 'finished', 'dropped', 'completed')),
	CONSTRAINT "user_rating_check" CHECK (user_rating >= 1 AND user_rating <= 10)
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"platform_game_id" text,
	"owned" boolean DEFAULT true,
	"purchased_date" date,
	"import_source" varchar(20),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_games_user_id_game_id_platform_id_unique" UNIQUE("user_id","game_id","platform_id")
);
--> statement-breakpoint
CREATE TABLE "user_playtime" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"total_minutes" integer DEFAULT 0,
	"last_played" timestamp with time zone,
	CONSTRAINT "user_playtime_user_id_game_id_platform_id_unique" UNIQUE("user_id","game_id","platform_id")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"default_view" varchar(10) DEFAULT 'grid',
	"items_per_page" integer DEFAULT 25,
	"theme" varchar(20) DEFAULT 'dark',
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "default_view_check" CHECK (default_view IN ('grid', 'table')),
	CONSTRAINT "items_per_page_check" CHECK (items_per_page IN (10, 25, 50, 100))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webauthn_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" bigint DEFAULT 0 NOT NULL,
	"device_name" varchar(100),
	"created_at" timestamp with time zone DEFAULT now(),
	"last_used" timestamp with time zone,
	CONSTRAINT "webauthn_credentials_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_games" ADD CONSTRAINT "collection_games_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_games" ADD CONSTRAINT "collection_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_completion_times" ADD CONSTRAINT "game_completion_times_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "psnprofiles_data" ADD CONSTRAINT "psnprofiles_data_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" ADD CONSTRAINT "user_game_custom_fields_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" ADD CONSTRAINT "user_game_custom_fields_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" ADD CONSTRAINT "user_game_custom_fields_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_progress" ADD CONSTRAINT "user_game_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_progress" ADD CONSTRAINT "user_game_progress_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_progress" ADD CONSTRAINT "user_game_progress_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_playtime" ADD CONSTRAINT "user_playtime_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_playtime" ADD CONSTRAINT "user_playtime_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_playtime" ADD CONSTRAINT "user_playtime_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_achievements_game_platform" ON "achievements" USING btree ("game_id","platform_id");--> statement-breakpoint
CREATE INDEX "idx_collection_games_collection" ON "collection_games" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX "idx_collections_user" ON "collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_game_genres_game" ON "game_genres" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_genres_genre" ON "game_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "idx_games_name" ON "games" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_games_rawg" ON "games" USING btree ("rawg_id");--> statement-breakpoint
CREATE INDEX "idx_games_slug" ON "games" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_games_series" ON "games" USING btree ("series_name");--> statement-breakpoint
CREATE INDEX "idx_sync_history_user" ON "sync_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sync_history_platform" ON "sync_history" USING btree ("platform_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_user" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_achievements_unlocked" ON "user_achievements" USING btree ("unlocked");--> statement-breakpoint
CREATE INDEX "idx_custom_fields_user_game" ON "user_game_custom_fields" USING btree ("user_id","game_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_user" ON "user_game_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_progress_status" ON "user_game_progress" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_favorites" ON "user_game_progress" USING btree ("user_id","is_favorite");--> statement-breakpoint
CREATE INDEX "idx_user_games_user" ON "user_games" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_games_game" ON "user_games" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_user_games_platform" ON "user_games" USING btree ("platform_id");--> statement-breakpoint
CREATE INDEX "idx_user_playtime_user" ON "user_playtime" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "idx_webauthn_user" ON "webauthn_credentials" USING btree ("user_id");