ALTER TABLE "games" ADD COLUMN "parent_game_id" uuid;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "is_edition" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX "idx_games_parent" ON "games" USING btree ("parent_game_id");