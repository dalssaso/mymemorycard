CREATE TYPE "public"."completion_type" AS ENUM('main', 'dlc', 'full', 'completionist');--> statement-breakpoint
ALTER TABLE "completion_logs" ADD COLUMN "completion_type" "completion_type" DEFAULT 'main' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_completion_logs_type" ON "completion_logs" USING btree ("completion_type");