CREATE TYPE "public"."api_service" AS ENUM('igdb', 'steam', 'retroachievements', 'rawg');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('twitch_oauth', 'steam_openid', 'api_key');--> statement-breakpoint
CREATE TYPE "public"."metadata_source" AS ENUM('igdb', 'rawg', 'manual');--> statement-breakpoint
CREATE TYPE "public"."store_type" AS ENUM('digital', 'physical');--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(50) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"store_type" "store_type" NOT NULL,
	"platform_family" varchar(50),
	"color_primary" varchar(7) DEFAULT '#6B7280' NOT NULL,
	"website_url" text,
	"icon_url" text,
	"supports_achievements" boolean DEFAULT false NOT NULL,
	"supports_library_sync" boolean DEFAULT false NOT NULL,
	"igdb_website_category" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_api_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"service" "api_service" NOT NULL,
	"credential_type" "credential_type" NOT NULL,
	"encrypted_credentials" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"has_valid_token" boolean DEFAULT false NOT NULL,
	"token_expires_at" timestamp with time zone,
	"last_validated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_api_credentials_user_id_service_unique" UNIQUE("user_id","service")
);
--> statement-breakpoint
ALTER TABLE "platforms" DROP CONSTRAINT "platforms_name_unique";--> statement-breakpoint
ALTER TABLE "admin_settings" ALTER COLUMN "id" SET DEFAULT '00000000-0000-0000-0000-000000000001';--> statement-breakpoint
ALTER TABLE "platforms" ALTER COLUMN "name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "metadata_source" "metadata_source" DEFAULT 'igdb';--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "igdb_platform_id" integer;--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "abbreviation" varchar(20);--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "slug" varchar(50);--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "platform_family" varchar(50);--> statement-breakpoint
ALTER TABLE "platforms" ADD COLUMN "created_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "user_games" ADD COLUMN "store_id" uuid;--> statement-breakpoint
ALTER TABLE "user_api_credentials" ADD CONSTRAINT "user_api_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_api_credentials_user" ON "user_api_credentials" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_games_igdb" ON "games" USING btree ("igdb_id");--> statement-breakpoint
CREATE INDEX "idx_platforms_igdb" ON "platforms" USING btree ("igdb_platform_id");--> statement-breakpoint
CREATE INDEX "idx_platforms_family" ON "platforms" USING btree ("platform_family");--> statement-breakpoint
CREATE INDEX "idx_user_games_store" ON "user_games" USING btree ("store_id");--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "display_name";--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "platform_type";--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "is_system";--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "is_physical";--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "website_url";--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "default_icon_url";--> statement-breakpoint
ALTER TABLE "platforms" DROP COLUMN "sort_order";--> statement-breakpoint
ALTER TABLE "platforms" ADD CONSTRAINT "platforms_igdb_platform_id_unique" UNIQUE("igdb_platform_id");--> statement-breakpoint
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_singleton_chk" CHECK ("admin_settings"."id" = '00000000-0000-0000-0000-000000000001'::uuid);--> statement-breakpoint
DROP TYPE "public"."platform_type";