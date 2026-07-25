import "dotenv/config";
import { db } from "./db/index";
import {
	teams,
	players,
	sessions,
	matches,
	match_participants,
	score_entries,
} from "./db/schema";
import { eq } from "drizzle-orm";

/**
 * Rebuilds teams / players / sessions / matches for the Scumbagger Invitational.
 * Leaves the tournament row and its course_holes untouched.
 *
 * Format: two 6-person teams, two sessions —
 *   1) 2v2 scramble (2 pts/match), 3 matches
 *   2) singles      (1 pt/match),  6 matches
 */
const TID = "e23dc36a-661c-417b-868c-10450e6c0ea4";

// Team 1 vs Team 2, in the order the pairings are drawn from.
const TEAM1 = ["Simmer", "Ari", "Morrow", "Kerbel", "Yitz", "Gluck"];
const TEAM2 = ["Ethan", "Wiser", "Mark", "Ruven", "Beber", "Kraft"];

function must<T>(rows: T[]): T {
	const row = rows[0];
	if (!row) throw new Error("Expected an inserted row but got none");
	return row;
}

async function reseed() {
	await db.transaction(async (tx) => {
		// Clear existing competition data for this tournament (course_holes kept).
		// Order matters: sessions cascade to matches -> participants + match scores;
		// players cascade to their own score_entries + participant rows.
		await tx.delete(sessions).where(eq(sessions.tournament_id, TID));
		await tx.delete(players).where(eq(players.tournament_id, TID));
		await tx.delete(teams).where(eq(teams.tournament_id, TID));

		// Teams
		const team1 = must(
			await tx.insert(teams).values({ tournament_id: TID, name: "Team 1" }).returning(),
		);
		const team2 = must(
			await tx.insert(teams).values({ tournament_id: TID, name: "Team 2" }).returning(),
		);

		// Players (order preserved so index-based pairings line up).
		const p1 = await tx
			.insert(players)
			.values(TEAM1.map((name) => ({ name, tournament_id: TID, team_id: team1.id })))
			.returning();
		const p2 = await tx
			.insert(players)
			.values(TEAM2.map((name) => ({ name, tournament_id: TID, team_id: team2.id })))
			.returning();
		if (p1.length !== 6 || p2.length !== 6) throw new Error("Failed to seed all 12 players");

		// --- Session 1: 2v2 scramble, worth 2 points per match ---
		const scramble = must(
			await tx
				.insert(sessions)
				.values({
					tournament_id: TID,
					name: "2v2 Scramble",
					session_type: "scramble",
					point_value: "2",
					sort_order: 1,
				})
				.returning(),
		);

		// Pairs: (0,1), (2,3), (4,5) — first two names of each team meet, etc.
		const scrambleMatches = [];
		for (let i = 0; i < 3; i++) {
			const a = p1[i * 2]!;
			const b = p1[i * 2 + 1]!;
			const c = p2[i * 2]!;
			const d = p2[i * 2 + 1]!;
			const m = must(
				await tx
					.insert(matches)
					.values({
						session_id: scramble.id,
						match_number: i + 1,
						status: i === 0 ? "in_progress" : "pending",
						started_at: i === 0 ? new Date() : null,
					})
					.returning(),
			);
			// One participant row per player; scramble scoring is recorded per team.
			await tx.insert(match_participants).values([
				{ match_id: m.id, player_id: a.id, team_id: team1.id },
				{ match_id: m.id, player_id: b.id, team_id: team1.id },
				{ match_id: m.id, player_id: c.id, team_id: team2.id },
				{ match_id: m.id, player_id: d.id, team_id: team2.id },
			]);
			scrambleMatches.push(m);
		}

		// --- Session 2: singles, worth 1 point per match ---
		const singles = must(
			await tx
				.insert(sessions)
				.values({
					tournament_id: TID,
					name: "Singles",
					session_type: "singles",
					point_value: "1",
					sort_order: 2,
				})
				.returning(),
		);

		// Singles pairings default to same-index head-to-head (Simmer v Ethan, ...).
		for (let i = 0; i < 6; i++) {
			const home = p1[i]!;
			const away = p2[i]!;
			const m = must(
				await tx
					.insert(matches)
					.values({
						session_id: singles.id,
						match_number: i + 1,
						status: "pending",
					})
					.returning(),
			);
			await tx.insert(match_participants).values([
				{ match_id: m.id, player_id: home.id, team_id: team1.id },
				{ match_id: m.id, player_id: away.id, team_id: team2.id },
			]);
		}

		// A few holes of live scramble scores on match 1 so the leaderboard has data.
		// Scramble is a team score, so these use team_id (not player_id).
		const m1 = scrambleMatches[0]!;
		await tx.insert(score_entries).values([
			{ team_id: team1.id, match_id: m1.id, hole_number: 1, strokes: 4 },
			{ team_id: team2.id, match_id: m1.id, hole_number: 1, strokes: 5 },
			{ team_id: team1.id, match_id: m1.id, hole_number: 2, strokes: 4 },
			{ team_id: team2.id, match_id: m1.id, hole_number: 2, strokes: 4 },
			{ team_id: team1.id, match_id: m1.id, hole_number: 3, strokes: 2 },
			{ team_id: team2.id, match_id: m1.id, hole_number: 3, strokes: 3 },
		]);
	});

	console.log(`Reseeded tournament ${TID} — 2 teams, 12 players, 2 sessions (scramble + singles).`);
}

reseed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Reseed failed:", err);
		process.exit(1);
	});
