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

// Rebuilds teams/players/sessions/matches for the Scumbagger Invitational,
// leaving the tournament row and its course_holes alone. Two 6-person teams,
// two sessions: a 2v2 scramble (3 matches, 2 pts each) and singles (6 matches,
// 1 pt each).
const TID = "e23dc36a-661c-417b-868c-10450e6c0ea4";

// Pairings are drawn from these lists in order.
const TEAM1 = ["Simmer", "Ari", "Ryan Morrow", "Eric Kerbel", "Isaac Yitz", "Jared Gluck"];
const TEAM2 = ["Ethan", "Wiser", "Mark Benhamu", "Ruven Heller", "Beber", "Kraft"];

function must<T>(rows: T[]): T {
	const row = rows[0];
	if (!row) throw new Error("Expected an inserted row but got none");
	return row;
}

// A scripted result. `outcome` is one char per hole played: "1" = Team 1 wins
// the hole, "2" = Team 2, "0" = halved; empty means not started. Strokes are
// arbitrary since match play only cares which side is lower.
interface MatchPlan {
	status: "pending" | "in_progress" | "completed";
	outcome: string;
}

const strokesFor = (c: string): [number, number] =>
	c === "1" ? [4, 5] : c === "2" ? [5, 4] : [4, 4];

// Scramble scores are recorded per team (team_id set, player_id null).
const scrambleScores = (matchId: string, outcome: string, t1: string, t2: string) =>
	[...outcome].flatMap((c, i) => {
		const [s1, s2] = strokesFor(c);
		return [
			{ team_id: t1, match_id: matchId, hole_number: i + 1, strokes: s1 },
			{ team_id: t2, match_id: matchId, hole_number: i + 1, strokes: s2 },
		];
	});

// Singles scores are per player (player_id set, team_id null).
const singlesScores = (matchId: string, outcome: string, p1: string, p2: string) =>
	[...outcome].flatMap((c, i) => {
		const [s1, s2] = strokesFor(c);
		return [
			{ player_id: p1, match_id: matchId, hole_number: i + 1, strokes: s1 },
			{ player_id: p2, match_id: matchId, hole_number: i + 1, strokes: s2 },
		];
	});

// 3 scramble matches. #1 live (Team 1 up 2 thru 3), #2 Team 1 wins 3&2,
// #3 Team 2 wins 4&3.
const SCRAMBLE_PLANS: MatchPlan[] = [
	{ status: "in_progress", outcome: "101" },
	{ status: "completed", outcome: "1111020000000000" },
	{ status: "completed", outcome: "222200000000000" },
];

// 6 singles matches. #1 Team 1 wins 2 up (all 18), #2 tied (AS thru 6),
// #3 Team 2 up 2 thru 4, #4–#6 not started.
const SINGLES_PLANS: MatchPlan[] = [
	{ status: "completed", outcome: "111020000000000000" },
	{ status: "in_progress", outcome: "120120" },
	{ status: "in_progress", outcome: "2020" },
	{ status: "pending", outcome: "" },
	{ status: "pending", outcome: "" },
	{ status: "pending", outcome: "" },
];

async function reseed() {
	await db.transaction(async (tx) => {
		// Wipe existing data (course_holes stay). Delete order matters: sessions
		// cascade to matches/participants/scores, players to their own rows.
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

		// Insert in list order so the index-based pairings line up.
		const p1 = await tx
			.insert(players)
			.values(TEAM1.map((name) => ({ name, tournament_id: TID, team_id: team1.id })))
			.returning();
		const p2 = await tx
			.insert(players)
			.values(TEAM2.map((name) => ({ name, tournament_id: TID, team_id: team2.id })))
			.returning();
		if (p1.length !== 6 || p2.length !== 6) throw new Error("Failed to seed all 12 players");

		// Session 1: 2v2 scramble, 2 points per match.
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

		// Collected across all matches, then inserted in one batch below.
		type ScoreRow =
			| { team_id: string; match_id: string; hole_number: number; strokes: number }
			| { player_id: string; match_id: string; hole_number: number; strokes: number };
		const scoreRows: ScoreRow[] = [];

		// Pair up each team's players two at a time: (0,1), (2,3), (4,5).
		for (let i = 0; i < 3; i++) {
			const a = p1[i * 2]!;
			const b = p1[i * 2 + 1]!;
			const c = p2[i * 2]!;
			const d = p2[i * 2 + 1]!;
			const plan = SCRAMBLE_PLANS[i]!;
			const m = must(
				await tx
					.insert(matches)
					.values({
						session_id: scramble.id,
						match_number: i + 1,
						status: plan.status,
						started_at: plan.status === "pending" ? null : new Date(),
					})
					.returning(),
			);
			// One participant row per player, even though scoring is per team.
			await tx.insert(match_participants).values([
				{ match_id: m.id, player_id: a.id, team_id: team1.id },
				{ match_id: m.id, player_id: b.id, team_id: team1.id },
				{ match_id: m.id, player_id: c.id, team_id: team2.id },
				{ match_id: m.id, player_id: d.id, team_id: team2.id },
			]);
			if (plan.outcome) {
				scoreRows.push(...scrambleScores(m.id, plan.outcome, team1.id, team2.id));
			}
		}

		// Session 2: singles, 1 point per match.
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

		// Same-index head-to-head: Simmer v Ethan, Ari v Wiser, and so on.
		for (let i = 0; i < 6; i++) {
			const home = p1[i]!;
			const away = p2[i]!;
			const plan = SINGLES_PLANS[i]!;
			const m = must(
				await tx
					.insert(matches)
					.values({
						session_id: singles.id,
						match_number: i + 1,
						status: plan.status,
						started_at: plan.status === "pending" ? null : new Date(),
					})
					.returning(),
			);
			await tx.insert(match_participants).values([
				{ match_id: m.id, player_id: home.id, team_id: team1.id },
				{ match_id: m.id, player_id: away.id, team_id: team2.id },
			]);
			if (plan.outcome) {
				scoreRows.push(...singlesScores(m.id, plan.outcome, home.id, away.id));
			}
		}

		if (scoreRows.length) await tx.insert(score_entries).values(scoreRows);
	});

	console.log(`Reseeded tournament ${TID} — 2 teams, 12 players, 2 sessions (scramble + singles).`);
}

reseed()
	.then(() => process.exit(0))
	.catch((err) => {
		console.error("Reseed failed:", err);
		process.exit(1);
	});
