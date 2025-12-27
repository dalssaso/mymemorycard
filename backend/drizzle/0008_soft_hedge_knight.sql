DROP INDEX "idx_games_parent";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "parent_game_id";--> statement-breakpoint
ALTER TABLE "games" DROP COLUMN "is_edition";