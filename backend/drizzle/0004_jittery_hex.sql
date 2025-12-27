CREATE TABLE "game_additions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"rawg_addition_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"released" date,
	"cover_image_url" text,
	"weight" real DEFAULT 1,
	"required_for_full" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "game_additions_game_id_rawg_addition_id_unique" UNIQUE("game_id","rawg_addition_id")
);
--> statement-breakpoint
ALTER TABLE "completion_logs" ADD COLUMN "dlc_id" uuid;--> statement-breakpoint
ALTER TABLE "game_additions" ADD CONSTRAINT "game_additions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_additions_game" ON "game_additions" USING btree ("game_id");--> statement-breakpoint
ALTER TABLE "completion_logs" ADD CONSTRAINT "completion_logs_dlc_id_game_additions_id_fk" FOREIGN KEY ("dlc_id") REFERENCES "public"."game_additions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_completion_logs_dlc" ON "completion_logs" USING btree ("dlc_id");