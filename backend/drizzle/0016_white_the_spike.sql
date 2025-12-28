ALTER TABLE "user_ai_settings" RENAME COLUMN "enabled" TO "is_active";--> statement-breakpoint
ALTER TABLE "user_ai_settings" DROP CONSTRAINT "user_ai_settings_pkey";--> statement-breakpoint
ALTER TABLE "user_ai_settings" ALTER COLUMN "provider" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_user_id_provider_pk" PRIMARY KEY("user_id","provider");