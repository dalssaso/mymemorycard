DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Vector extension not available, skipping AI features';
END $$;--> statement-breakpoint
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS "game_embeddings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "game_id" uuid NOT NULL,
        "embedding" vector(1536),
        "text_hash" varchar(64) NOT NULL,
        "model" varchar(50) DEFAULT 'text-embedding-3-small' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now(),
        CONSTRAINT "game_embeddings_game_id_unique" UNIQUE("game_id")
    );

    ALTER TABLE "game_embeddings" ADD CONSTRAINT "game_embeddings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "idx_game_embeddings_game" ON "game_embeddings" USING btree ("game_id");
    CREATE INDEX IF NOT EXISTS "idx_game_embeddings_vector" ON "game_embeddings" USING hnsw ("embedding" vector_cosine_ops);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping game_embeddings table (vector extension not available)';
END $$;