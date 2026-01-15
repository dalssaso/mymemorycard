CREATE TYPE "public"."analytics_provider" AS ENUM('umami', 'plausible', 'posthog', 'google-analytics');--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
	"analytics_enabled" boolean DEFAULT false NOT NULL,
	"analytics_provider" "analytics_provider",
	"analytics_key" varchar(255),
	"analytics_host" text,
	"search_server_side" boolean DEFAULT true NOT NULL,
	"search_debounce_ms" integer DEFAULT 300 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "admin_settings_singleton_chk" CHECK ("admin_settings"."id" = '00000000-0000-0000-0000-000000000001'::uuid)
);
