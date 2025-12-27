CREATE TABLE "user_game_display_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"rawg_edition_id" integer,
	"edition_name" text NOT NULL,
	"cover_art_url" text,
	"background_image_url" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_game_display_editions_user_id_game_id_platform_id_unique" UNIQUE("user_id","game_id","platform_id")
);
--> statement-breakpoint
ALTER TABLE "user_game_display_editions" ADD CONSTRAINT "user_game_display_editions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_display_editions" ADD CONSTRAINT "user_game_display_editions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_display_editions" ADD CONSTRAINT "user_game_display_editions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_game_display_editions_user" ON "user_game_display_editions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_game_display_editions_game" ON "user_game_display_editions" USING btree ("game_id");