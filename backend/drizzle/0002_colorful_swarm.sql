CREATE TABLE "completion_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"percentage" integer NOT NULL,
	"logged_at" timestamp with time zone DEFAULT now(),
	"notes" text,
	CONSTRAINT "percentage_check" CHECK (percentage >= 0 AND percentage <= 100)
);
--> statement-breakpoint
CREATE TABLE "play_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"platform_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" DROP CONSTRAINT "replay_value_check";--> statement-breakpoint
ALTER TABLE "completion_logs" ADD CONSTRAINT "completion_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_logs" ADD CONSTRAINT "completion_logs_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completion_logs" ADD CONSTRAINT "completion_logs_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play_sessions" ADD CONSTRAINT "play_sessions_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_completion_logs_user" ON "completion_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_completion_logs_game" ON "completion_logs" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_completion_logs_date" ON "completion_logs" USING btree ("logged_at");--> statement-breakpoint
CREATE INDEX "idx_play_sessions_user" ON "play_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_play_sessions_game" ON "play_sessions" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "idx_play_sessions_date" ON "play_sessions" USING btree ("started_at");--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" DROP COLUMN "estimated_completion_hours";--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" DROP COLUMN "actual_playtime_hours";--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" DROP COLUMN "achievements_total";--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" DROP COLUMN "achievements_earned";--> statement-breakpoint
ALTER TABLE "user_game_custom_fields" DROP COLUMN "replay_value";