CREATE TYPE "public"."analytics_provider" AS ENUM('umami', 'plausible', 'posthog', 'google-analytics');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"analytics_enabled" boolean DEFAULT false NOT NULL,
	"analytics_provider" "analytics_provider",
	"analytics_key" varchar(255),
	"analytics_host" text,
	"search_server_side" boolean DEFAULT true NOT NULL,
	"search_debounce_ms" integer DEFAULT 300 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
