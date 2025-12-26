CREATE TABLE "game_rawg_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"rawg_achievement_id" integer NOT NULL,
	"name" text,
	"description" text,
	"image_url" text,
	"rarity_percent" real,
	CONSTRAINT "game_rawg_achievements_game_id_rawg_achievement_id_unique" UNIQUE("game_id","rawg_achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_rawg_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"rawg_achievement_id" integer NOT NULL,
	"completed" boolean DEFAULT false,
	"completed_at" timestamp with time zone,
	CONSTRAINT "user_rawg_achievements_user_id_game_id_rawg_achievement_id_unique" UNIQUE("user_id","game_id","rawg_achievement_id")
);
--> statement-breakpoint
ALTER TABLE "game_rawg_achievements" ADD CONSTRAINT "game_rawg_achievements_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rawg_achievements" ADD CONSTRAINT "user_rawg_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_rawg_achievements" ADD CONSTRAINT "user_rawg_achievements_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_rawg_achievements_game" ON "game_rawg_achievements" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_user_rawg_achievements_user" ON "user_rawg_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_rawg_achievements_game" ON "user_rawg_achievements" USING btree ("game_id");