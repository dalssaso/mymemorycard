CREATE TYPE "public"."addition_type" AS ENUM('dlc', 'edition', 'other');--> statement-breakpoint
CREATE TABLE "user_game_additions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"addition_id" uuid NOT NULL,
	"owned" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_game_additions_user_id_game_id_platform_id_addition_id_unique" UNIQUE("user_id","game_id","platform_id","addition_id")
);
--> statement-breakpoint
CREATE TABLE "user_game_editions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"edition_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_game_editions_user_id_game_id_platform_id_unique" UNIQUE("user_id","game_id","platform_id")
);
--> statement-breakpoint
ALTER TABLE "game_additions" ADD COLUMN "addition_type" "addition_type" DEFAULT 'dlc' NOT NULL;--> statement-breakpoint
ALTER TABLE "game_additions" ADD COLUMN "is_complete_edition" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "user_game_additions" ADD CONSTRAINT "user_game_additions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_additions" ADD CONSTRAINT "user_game_additions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_additions" ADD CONSTRAINT "user_game_additions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_additions" ADD CONSTRAINT "user_game_additions_addition_id_game_additions_id_fk" FOREIGN KEY ("addition_id") REFERENCES "public"."game_additions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_editions" ADD CONSTRAINT "user_game_editions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_editions" ADD CONSTRAINT "user_game_editions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_editions" ADD CONSTRAINT "user_game_editions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_game_editions" ADD CONSTRAINT "user_game_editions_edition_id_game_additions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."game_additions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_game_additions_user" ON "user_game_additions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_game_additions_game" ON "user_game_additions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_user_game_editions_user" ON "user_game_editions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_game_editions_game" ON "user_game_editions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_additions_type" ON "game_additions" USING btree ("addition_type");