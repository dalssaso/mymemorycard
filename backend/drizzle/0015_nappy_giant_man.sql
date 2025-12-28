CREATE TYPE "public"."ai_action_type" AS ENUM('suggest_collections', 'suggest_next_game', 'generate_cover_image');--> statement-breakpoint
CREATE TYPE "public"."ai_provider" AS ENUM('openai', 'openrouter', 'ollama', 'lmstudio');--> statement-breakpoint
CREATE TABLE "ai_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action_type" "ai_action_type" NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"collection_id" uuid,
	"user_input" text,
	"prompt_tokens" integer,
	"completion_tokens" integer,
	"total_tokens" integer,
	"estimated_cost_usd" real,
	"duration_ms" integer,
	"success" boolean NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_ai_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"provider" "ai_provider" DEFAULT 'openai' NOT NULL,
	"base_url" text,
	"api_key_encrypted" text,
	"model" varchar(100) DEFAULT 'gpt-4.1-mini' NOT NULL,
	"image_api_key_encrypted" text,
	"image_model" varchar(100) DEFAULT 'dall-e-3',
	"temperature" real DEFAULT 0.7,
	"max_tokens" integer DEFAULT 2000,
	"enabled" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_activity_logs" ADD CONSTRAINT "ai_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_activity_logs" ADD CONSTRAINT "ai_activity_logs_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_ai_settings" ADD CONSTRAINT "user_ai_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_activity_user" ON "ai_activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_activity_action" ON "ai_activity_logs" USING btree ("action_type");--> statement-breakpoint
CREATE INDEX "idx_ai_activity_date" ON "ai_activity_logs" USING btree ("created_at");