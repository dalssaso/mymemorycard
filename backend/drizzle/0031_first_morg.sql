CREATE TYPE "public"."achievement_source_api" AS ENUM('steam', 'retroachievements', 'rawg', 'manual');--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "source_api" "achievement_source_api" DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "external_id" text;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE INDEX "idx_achievements_source" ON "achievements" USING btree ("source_api");