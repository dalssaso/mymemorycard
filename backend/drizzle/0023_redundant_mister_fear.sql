ALTER TYPE "public"."ai_provider" ADD VALUE 'xai';--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD COLUMN "xai_api_key_encrypted" text;--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD COLUMN "xai_base_url" text;