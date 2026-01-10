ALTER TABLE "user_ai_settings" DROP COLUMN IF EXISTS "xai_api_key_encrypted";--> statement-breakpoint
ALTER TABLE "user_ai_settings" DROP COLUMN IF EXISTS "xai_base_url";--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD COLUMN "gateway_api_key_encrypted" text;