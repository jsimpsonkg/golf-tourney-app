CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text
);
--> statement-breakpoint
DROP INDEX "score_entries_player_match_hole_unq";--> statement-breakpoint
ALTER TABLE "score_entries" ALTER COLUMN "player_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "course_holes" ADD COLUMN "course_id" uuid;--> statement-breakpoint
ALTER TABLE "course_holes" ADD COLUMN "yardage" integer;--> statement-breakpoint
ALTER TABLE "score_entries" ADD COLUMN "team_id" uuid;--> statement-breakpoint
ALTER TABLE "course_holes" ADD CONSTRAINT "course_holes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_entries" ADD CONSTRAINT "score_entries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "score_entries_team_match_hole_unq" ON "score_entries" USING btree ("team_id","match_id","hole_number") WHERE "score_entries"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "score_entries_player_match_hole_unq" ON "score_entries" USING btree ("player_id","match_id","hole_number") WHERE "score_entries"."player_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "score_entries" ADD CONSTRAINT "score_entries_player_xor_team_chk" CHECK (("score_entries"."player_id" IS NOT NULL) != ("score_entries"."team_id" IS NOT NULL));