import "dotenv/config";
import { db } from "./db/index";
import {
  tournaments,
  teams,
  players,
  sessions,
  matches,
  match_participants,
  courses,
  course_holes,
  score_entries,
} from "./db/schema";

/** Grab the first inserted row or fail loudly (satisfies noUncheckedIndexedAccess). */
function must<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) throw new Error("Expected an inserted row but got none");
  return row;
}

// Par for a stock 18-hole course (par 72).
const PARS = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];

async function seed() {
  // Wipe prior data — cascades to teams/players/sessions/matches/scores.
  await db.delete(tournaments);

  const tournament = must(
    await db
      .insert(tournaments)
      .values({
        name: "Test Tournament",
        format: "rydercup",
        image_url: "/images/dolphins-logo.jpg",
        start_date: new Date(),
      })
      .returning(),
  );

  const teamA = must(
    await db
      .insert(teams)
      .values({ tournament_id: tournament.id, name: "Team USA" })
      .returning(),
  );
  const teamB = must(
    await db
      .insert(teams)
      .values({ tournament_id: tournament.id, name: "Team Europe" })
      .returning(),
  );

  const [alice, greg, tara, seve] = await db
    .insert(players)
    .values([
      { name: "Alice", tournament_id: tournament.id, team_id: teamA.id },
      { name: "Greg", tournament_id: tournament.id, team_id: teamA.id },
      { name: "Tara", tournament_id: tournament.id, team_id: teamB.id },
      { name: "Seve", tournament_id: tournament.id, team_id: teamB.id },
    ])
    .returning();

  if (!alice || !greg || !tara || !seve) {
    throw new Error("Failed to seed players");
  }

  // Course holes 1..18.
  const course = must(
    await db.insert(courses).values({ name: "Test Course" }).returning(),
  );
  await db.insert(course_holes).values(
    PARS.map((par, i) => ({
      tournament_id: tournament.id,
      course_id: course.id,
      hole_number: i + 1,
      par,
      stroke_index: i + 1,
    })),
  );

  // One singles session worth 1 point per match.
  const singles = must(
    await db
      .insert(sessions)
      .values({
        tournament_id: tournament.id,
        name: "Singles",
        session_type: "singles",
        course_id: course.id,
        point_value: "1",
        sort_order: 1,
      })
      .returning(),
  );

  // Two singles matches (1 player per side).
  const match1 = must(
    await db
      .insert(matches)
      .values({
        session_id: singles.id,
        match_number: 1,
        status: "in_progress",
        started_at: new Date(),
      })
      .returning(),
  );
  const match2 = must(
    await db
      .insert(matches)
      .values({ session_id: singles.id, match_number: 2, status: "pending" })
      .returning(),
  );

  await db.insert(match_participants).values([
    { match_id: match1.id, player_id: alice.id, team_id: teamA.id },
    { match_id: match1.id, player_id: tara.id, team_id: teamB.id },
    { match_id: match2.id, player_id: greg.id, team_id: teamA.id },
    { match_id: match2.id, player_id: seve.id, team_id: teamB.id },
  ]);

  // A few holes of live scores on match 1 so the leaderboard has something to
  // compute once the scoring engine (Step 3) lands.
  await db.insert(score_entries).values([
    { player_id: alice.id, match_id: match1.id, hole_number: 1, strokes: 4 },
    { player_id: tara.id, match_id: match1.id, hole_number: 1, strokes: 5 },
    { player_id: alice.id, match_id: match1.id, hole_number: 2, strokes: 4 },
    { player_id: tara.id, match_id: match1.id, hole_number: 2, strokes: 4 },
    { player_id: alice.id, match_id: match1.id, hole_number: 3, strokes: 3 },
    { player_id: tara.id, match_id: match1.id, hole_number: 3, strokes: 2 },
  ]);

  console.log(`Seeded tournament ${tournament.id} ("${tournament.name}")`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
