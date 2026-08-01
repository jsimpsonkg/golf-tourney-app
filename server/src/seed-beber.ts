import "dotenv/config";
import { db } from "./db/index";
import {
	tournaments,
	courses,
	course_holes,
	teams,
	players,
	sessions,
	matches,
	match_participants,
} from "./db/schema";
import { eq, sql } from "drizzle-orm";

// Seeds the Beber Invitational: two 5-person teams over two rounds on two
// different courses. Each round is one session (one tab) holding two 2v2
// scramble matches worth 2 points and one singles match worth 1 — the mixed
// point values ride on the matches, which is what matches.point_value is for.
//
// Rerunnable: it deletes any tournament of the same name first, so it can be
// re-run once the real pairings are known.
const TOURNAMENT_NAME = "Beber Invitational";

const TEAM_1 = { name: "Isaiah's team", players: ["Simmer", "Morrow", "Sam", "Ari", "Kibel"] };
const TEAM_2 = { name: "Ruven's team", players: ["Ethan", "Yitz", "Nolan", "Beber", "Mark"] };

// [par, stroke_index, yardage] per hole, 1..18, off the printed scorecards.
type Hole = [par: number, si: number, yards: number];

interface CourseSpec {
	name: string;
	tees: string;
	holes: Hole[];
	// Printed totals, asserted below so a transcription slip fails loudly.
	total_par: number;
	total_yards: number;
}

const THE_ROCK: CourseSpec = {
	name: "The Rock",
	tees: "Gold",
	total_par: 71,
	total_yards: 6140,
	holes: [
		[5, 7, 440], [3, 15, 178], [4, 5, 455], [4, 11, 343], [3, 17, 128],
		[4, 3, 411], [4, 9, 366], [3, 13, 169], [5, 1, 588],
		[4, 10, 365], [3, 16, 140], [4, 8, 396], [4, 6, 383], [4, 14, 287],
		[4, 12, 332], [5, 2, 510], [3, 18, 158], [5, 4, 491],
	],
};

const MUSKOKA_HIGHLANDS: CourseSpec = {
	name: "Muskoka Highlands",
	tees: "Gold",
	total_par: 69,
	total_yards: 5644,
	holes: [
		[4, 3, 398], [3, 7, 178], [5, 17, 483], [4, 15, 311], [4, 9, 368],
		[4, 1, 405], [3, 5, 200], [3, 13, 132], [5, 11, 540],
		[3, 4, 186], [4, 10, 378], [4, 14, 288], [3, 16, 121], [4, 6, 302],
		[4, 18, 304], [5, 2, 510], [3, 12, 169], [4, 8, 371],
	],
};

function must<T>(rows: T[]): T {
	const row = rows[0];
	if (!row) throw new Error("Expected an inserted row but got none");
	return row;
}

// Guards against a mistyped hole: pars, yardages and stroke indexes all have
// to add up to what's printed on the card.
function validate(c: CourseSpec) {
	if (c.holes.length !== 18) throw new Error(`${c.name}: expected 18 holes, got ${c.holes.length}`);

	const par = c.holes.reduce((sum, [p]) => sum + p, 0);
	if (par !== c.total_par) throw new Error(`${c.name}: pars sum to ${par}, card says ${c.total_par}`);

	const yards = c.holes.reduce((sum, [, , y]) => sum + y, 0);
	if (yards !== c.total_yards)
		throw new Error(`${c.name}: yardage sums to ${yards}, card says ${c.total_yards}`);

	const indexes = [...c.holes.map(([, si]) => si)].sort((a, b) => a - b);
	const expected = Array.from({ length: 18 }, (_, i) => i + 1);
	if (indexes.join() !== expected.join())
		throw new Error(`${c.name}: stroke indexes aren't 1–18 exactly once`);
}

// Fisher-Yates. The real pairings aren't set yet, so matchups are drawn at
// random — rerun this script (or edit the matches) once they are.
function shuffled<T>(items: T[]): T[] {
	const out = [...items];
	for (let i = out.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[out[i], out[j]] = [out[j]!, out[i]!];
	}
	return out;
}

async function seed() {
	validate(THE_ROCK);
	validate(MUSKOKA_HIGHLANDS);

	const tournamentId = await db.transaction(async (tx) => {
		// Start clean so reruns replace the tournament rather than duplicating
		// it. Cascades through teams, players, sessions, matches and scores.
		await tx.delete(tournaments).where(eq(tournaments.name, TOURNAMENT_NAME));

		// Courses aren't owned by a tournament, so the delete above leaves the
		// ones this script created behind — holes and sessions cascade away but
		// the course row survives, and reruns pile them up. Sweep any course
		// nothing points at. Courses still in use by another tournament keep
		// their holes, so they're never matched here.
		await tx.execute(sql`
			DELETE FROM courses c
			WHERE NOT EXISTS (SELECT 1 FROM course_holes ch WHERE ch.course_id = c.id)
			  AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.course_id = c.id)
		`);

		const tournament = must(
			await tx
				.insert(tournaments)
				.values({
					name: TOURNAMENT_NAME,
					format: "rydercup",
					start_date: new Date(),
				})
				.returning(),
		);

		// Courses, with their holes.
		const courseIds = new Map<string, string>();
		for (const spec of [THE_ROCK, MUSKOKA_HIGHLANDS]) {
			const course = must(
				await tx.insert(courses).values({ name: spec.name }).returning(),
			);
			await tx.insert(course_holes).values(
				spec.holes.map(([par, stroke_index, yardage], i) => ({
					tournament_id: tournament.id,
					course_id: course.id,
					hole_number: i + 1,
					par,
					stroke_index,
					yardage,
				})),
			);
			courseIds.set(spec.name, course.id);
		}

		// Teams and their rosters.
		const roster = [];
		for (const spec of [TEAM_1, TEAM_2]) {
			const team = must(
				await tx
					.insert(teams)
					.values({ tournament_id: tournament.id, name: spec.name })
					.returning(),
			);
			const inserted = await tx
				.insert(players)
				.values(
					spec.players.map((name) => ({
						name,
						tournament_id: tournament.id,
						team_id: team.id,
					})),
				)
				.returning();
			if (inserted.length !== spec.players.length)
				throw new Error(`Failed to seed all players for ${spec.name}`);
			roster.push({ team, players: inserted });
		}

		const [side1, side2] = roster;
		if (!side1 || !side2) throw new Error("Expected two teams");

		// Both rounds share a structure: two 2v2 scrambles then one singles.
		const rounds = [
			{ name: "Round 1", course: THE_ROCK.name },
			{ name: "Round 2", course: MUSKOKA_HIGHLANDS.name },
		];

		for (const [roundIndex, round] of rounds.entries()) {
			const session = must(
				await tx
					.insert(sessions)
					.values({
						tournament_id: tournament.id,
						name: round.name,
						// The round mixes formats, so the session carries the
						// dominant one and each match names its own.
						session_type: "mixed",
						course_id: courseIds.get(round.course)!,
						point_value: "2", // scramble default; the singles match overrides it
						sort_order: roundIndex + 1,
					})
					.returning(),
			);

			// Draw fresh pairings per round so the two days aren't identical.
			const a = shuffled(side1.players);
			const b = shuffled(side2.players);

			// Two 2v2s off the first four, then the leftover player each side
			// meets head to head.
			const pairings = [
				{ type: "scramble", points: "2", a: a.slice(0, 2), b: b.slice(0, 2) },
				{ type: "scramble", points: "2", a: a.slice(2, 4), b: b.slice(2, 4) },
				{ type: "singles", points: "1", a: a.slice(4, 5), b: b.slice(4, 5) },
			];

			for (const [i, pairing] of pairings.entries()) {
				const match = must(
					await tx
						.insert(matches)
						.values({
							session_id: session.id,
							match_number: i + 1,
							match_type: pairing.type,
							point_value: pairing.points,
							status: "pending",
						})
						.returning(),
				);
				await tx.insert(match_participants).values([
					...pairing.a.map((p) => ({
						match_id: match.id,
						player_id: p.id,
						team_id: side1.team.id,
					})),
					...pairing.b.map((p) => ({
						match_id: match.id,
						player_id: p.id,
						team_id: side2.team.id,
					})),
				]);
			}
		}

		return tournament.id;
	});

	console.log(
		`Seeded "${TOURNAMENT_NAME}" (${tournamentId}) — 2 teams, 10 players, ` +
			`Round 1 at ${THE_ROCK.name} (${THE_ROCK.tees}), ` +
			`Round 2 at ${MUSKOKA_HIGHLANDS.name} (${MUSKOKA_HIGHLANDS.tees}). ` +
			`Matchups are randomized placeholders.`,
	);
}

seed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Seed failed:", err);
		process.exit(1);
	});
