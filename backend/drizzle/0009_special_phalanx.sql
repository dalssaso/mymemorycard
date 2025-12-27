-- First, delete any existing user_rawg_achievements since we're changing the schema
-- and they don't have platform info (they'll need to be re-tracked per platform)
DELETE FROM "user_rawg_achievements";--> statement-breakpoint
ALTER TABLE "user_rawg_achievements" DROP CONSTRAINT "user_rawg_achievements_user_id_game_id_rawg_achievement_id_unique";--> statement-breakpoint
ALTER TABLE "user_rawg_achievements" ADD COLUMN "platform_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_rawg_achievements" ADD CONSTRAINT "user_rawg_achievements_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_rawg_achievements_platform" ON "user_rawg_achievements" USING btree ("platform_id");--> statement-breakpoint
ALTER TABLE "user_rawg_achievements" ADD CONSTRAINT "user_rawg_achievements_user_id_game_id_platform_id_rawg_achievement_id_unique" UNIQUE("user_id","game_id","platform_id","rawg_achievement_id");
