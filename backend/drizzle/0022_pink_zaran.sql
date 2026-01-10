ALTER TABLE "user_ai_settings" ADD COLUMN "collection_suggestions_model" varchar(100);--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD COLUMN "next_game_suggestions_model" varchar(100);--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD COLUMN "cover_generation_model" varchar(100);--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD COLUMN "enable_smart_routing" boolean DEFAULT true;