CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "game_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"embedding" vector(1536),
	"text_hash" varchar(64) NOT NULL,
	"model" varchar(50) DEFAULT 'text-embedding-3-small' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "game_embeddings_game_id_unique" UNIQUE("game_id")
);
--> statement-breakpoint
ALTER TABLE "game_embeddings" ADD CONSTRAINT "game_embeddings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_game_embeddings_game" ON "game_embeddings" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_game_embeddings_vector" ON "game_embeddings" USING hnsw ("embedding" vector_cosine_ops);