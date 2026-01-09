CREATE TABLE "achievement_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"achievement_id" uuid NOT NULL,
	"embedding" vector(1536),
	"text_hash" varchar(64) NOT NULL,
	"model" varchar(50) DEFAULT 'text-embedding-3-small' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "achievement_embeddings_achievement_id_unique" UNIQUE("achievement_id")
);
--> statement-breakpoint
ALTER TABLE "achievement_embeddings" ADD CONSTRAINT "achievement_embeddings_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_achievement_embeddings_achievement" ON "achievement_embeddings" USING btree ("achievement_id");--> statement-breakpoint
CREATE INDEX "idx_achievement_embeddings_text_hash" ON "achievement_embeddings" USING btree ("text_hash");--> statement-breakpoint
CREATE INDEX "idx_achievement_embeddings_vector" ON "achievement_embeddings" USING hnsw ("embedding" vector_cosine_ops);