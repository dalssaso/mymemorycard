DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS "collection_embeddings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "collection_id" uuid NOT NULL,
        "embedding" vector(1536),
        "text_hash" varchar(64) NOT NULL,
        "model" varchar(50) DEFAULT 'text-embedding-3-small' NOT NULL,
        "created_at" timestamp with time zone DEFAULT now(),
        "updated_at" timestamp with time zone DEFAULT now(),
        CONSTRAINT "collection_embeddings_collection_id_unique" UNIQUE("collection_id")
    );

    ALTER TABLE "collection_embeddings" ADD CONSTRAINT "collection_embeddings_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX IF NOT EXISTS "idx_collection_embeddings_collection" ON "collection_embeddings" USING btree ("collection_id");
    CREATE INDEX IF NOT EXISTS "idx_collection_embeddings_text_hash" ON "collection_embeddings" USING btree ("text_hash");
    CREATE INDEX IF NOT EXISTS "idx_collection_embeddings_vector" ON "collection_embeddings" USING hnsw ("embedding" vector_cosine_ops);
    CREATE INDEX IF NOT EXISTS "idx_game_embeddings_text_hash" ON "game_embeddings" USING btree ("text_hash");
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Skipping collection_embeddings table (vector extension not available)';
END $$;