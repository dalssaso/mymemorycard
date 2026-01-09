CREATE TABLE "user_preference_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"preference_type" varchar(50) NOT NULL,
	"embedding" vector(1536),
	"confidence" real DEFAULT 0.5 NOT NULL,
	"sample_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "user_preference_embeddings_user_id_preference_type_unique" UNIQUE("user_id","preference_type")
);
--> statement-breakpoint
ALTER TABLE "user_preference_embeddings" ADD CONSTRAINT "user_preference_embeddings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_pref_embeddings_user" ON "user_preference_embeddings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_pref_embeddings_vector" ON "user_preference_embeddings" USING hnsw ("embedding" vector_cosine_ops);