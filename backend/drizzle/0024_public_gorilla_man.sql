DROP TABLE "achievement_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE "ai_activity_logs" CASCADE;--> statement-breakpoint
DROP TABLE "collection_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE "game_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE "user_ai_settings" CASCADE;--> statement-breakpoint
DROP TABLE "user_preference_embeddings" CASCADE;--> statement-breakpoint
DROP TYPE "public"."ai_action_type";--> statement-breakpoint
DROP TYPE "public"."ai_provider";--> statement-breakpoint
DROP EXTENSION IF EXISTS vector CASCADE;