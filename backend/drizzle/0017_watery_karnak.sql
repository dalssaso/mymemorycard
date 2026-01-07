-- Delete non-OpenAI provider configurations
DELETE FROM "user_ai_settings" WHERE "provider" != 'openai';--> statement-breakpoint
ALTER TABLE "user_ai_settings" ALTER COLUMN "provider" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."ai_provider";--> statement-breakpoint
CREATE TYPE "public"."ai_provider" AS ENUM('openai');--> statement-breakpoint
ALTER TABLE "user_ai_settings" ALTER COLUMN "provider" SET DATA TYPE "public"."ai_provider" USING "provider"::"public"."ai_provider";