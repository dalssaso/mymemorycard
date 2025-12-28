-- First, set default values for existing NULL platform_type
UPDATE "platforms" SET "platform_type" = 'pc' WHERE "platform_type" IS NULL;--> statement-breakpoint
-- Create the enum type
CREATE TYPE "public"."platform_type" AS ENUM('pc', 'console', 'mobile', 'physical');--> statement-breakpoint
-- Convert existing column to enum type
ALTER TABLE "platforms" ALTER COLUMN "platform_type" SET DATA TYPE "public"."platform_type" USING "platform_type"::"public"."platform_type";--> statement-breakpoint
-- Set NOT NULL constraint
ALTER TABLE "platforms" ALTER COLUMN "platform_type" SET NOT NULL;--> statement-breakpoint
-- Add new columns
ALTER TABLE "platforms" ADD COLUMN "is_system" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "is_physical" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "color_primary" varchar(7) DEFAULT '#6B7280' NOT NULL;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "default_icon_url" text;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "sort_order" integer DEFAULT 0;