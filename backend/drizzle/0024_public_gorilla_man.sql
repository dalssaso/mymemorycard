DROP TABLE IF EXISTS "achievement_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "ai_activity_logs" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "collection_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "game_embeddings" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_ai_settings" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "user_preference_embeddings" CASCADE;--> statement-breakpoint
DROP TYPE IF EXISTS "public"."ai_action_type";--> statement-breakpoint
DROP TYPE IF EXISTS "public"."ai_provider";--> statement-breakpoint
DROP EXTENSION IF EXISTS vector CASCADE;