ALTER TABLE "user_ai_settings" ADD COLUMN "gateway_api_key_encrypted" text;--> statement-breakpoint
ALTER TABLE "user_ai_settings" DROP COLUMN "xai_api_key_encrypted";--> statement-breakpoint
ALTER TABLE "user_ai_settings" DROP COLUMN "xai_base_url";