ALTER TABLE "games" ADD COLUMN "steam_app_id" integer;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "retro_game_id" integer;--> statement-breakpoint
CREATE INDEX "idx_games_steam" ON "games" USING btree ("steam_app_id");--> statement-breakpoint
CREATE INDEX "idx_games_retro" ON "games" USING btree ("retro_game_id");--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_steam_app_id_unique" UNIQUE("steam_app_id");--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_retro_game_id_unique" UNIQUE("retro_game_id");