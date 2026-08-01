-- Holes move from being owned by a tournament to being owned by a course, and
-- each session points at the course its round is played on. That's what lets
-- one tournament span two venues (e.g. The Rock for round 1, Muskoka Highlands
-- for round 2) instead of being capped at 18 holes total.

ALTER TABLE "sessions" ADD COLUMN "course_id" uuid;--> statement-breakpoint

-- Backfill: every tournament whose holes predate `courses` gets one course row
-- carrying its existing 18 holes, and its sessions are pointed at it. Without
-- this the SET NOT NULL below fails on any database with existing holes.
DO $$
DECLARE
	t RECORD;
	new_course uuid;
BEGIN
	FOR t IN SELECT DISTINCT tournament_id FROM course_holes WHERE course_id IS NULL LOOP
		INSERT INTO courses (name) VALUES (NULL) RETURNING id INTO new_course;

		UPDATE course_holes
			SET course_id = new_course
			WHERE tournament_id = t.tournament_id AND course_id IS NULL;

		UPDATE sessions
			SET course_id = new_course
			WHERE tournament_id = t.tournament_id AND course_id IS NULL;
	END LOOP;
END $$;--> statement-breakpoint

-- The one existing tournament plays Muskoka Highlands (the venue the client
-- header hardcoded until now), so give its backfilled course that name.
UPDATE courses SET name = 'Muskoka Highlands'
	WHERE name IS NULL AND id IN (
		SELECT DISTINCT ch.course_id FROM course_holes ch
		JOIN tournaments t ON t.id = ch.tournament_id
		WHERE t.name = 'Scumbagger Invitational'
	);--> statement-breakpoint

ALTER TABLE "course_holes" DROP CONSTRAINT "course_holes_course_id_courses_id_fk";
--> statement-breakpoint
DROP INDEX "course_holes_tournament_hole_unq";--> statement-breakpoint
ALTER TABLE "course_holes" ALTER COLUMN "course_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "course_holes" ADD CONSTRAINT "course_holes_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "course_holes_course_hole_unq" ON "course_holes" USING btree ("course_id","hole_number");--> statement-breakpoint
CREATE INDEX "course_holes_tournament_idx" ON "course_holes" USING btree ("tournament_id");
