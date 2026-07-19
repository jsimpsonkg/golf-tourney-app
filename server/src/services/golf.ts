import { eq, inArray } from "drizzle-orm";
import type { Handler } from "express";
import { db } from "../db/index";
import {
	tournaments,
	teams,
	players,
	sessions,
	matches,
	match_participants,
	score_entries,
} from "../db/schema";
import type {
	Tournament,
	Team,
	Player,
	Session,
	Match,
	MatchParticipant,
	ScoreEntry,
	SessionWithMatches,
	MatchWithParticipants,
	TournamentDetail,
	MatchDbStatus,
} from "@golf/shared";

// ---------------------------------------------------------------------------
// Row → API-shape mappers (Drizzle returns Date/numeric-as-string; the shared
// contract is JSON-friendly, so normalize here).
// ---------------------------------------------------------------------------

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

const toTournament = (r: Row<typeof tournaments>): Tournament => ({
	id: r.id,
	name: r.name,
	start_date: r.start_date ? r.start_date.toISOString() : null,
	image_url: r.image_url,
	format: r.format,
	settings: (r.settings ?? {}) as Record<string, unknown>,
	created_at: r.created_at.toISOString(),
});

const toTeam = (r: Row<typeof teams>): Team => ({
	id: r.id,
	tournament_id: r.tournament_id,
	name: r.name,
});

const toPlayer = (r: Row<typeof players>): Player => ({
	id: r.id,
	name: r.name,
	tournament_id: r.tournament_id,
	team_id: r.team_id,
});

const toSession = (r: Row<typeof sessions>): Session => ({
	id: r.id,
	tournament_id: r.tournament_id,
	name: r.name,
	session_type: r.session_type,
	point_value: Number(r.point_value),
	sort_order: r.sort_order ?? 0,
});

const toMatch = (r: Row<typeof matches>): Match => ({
	id: r.id,
	session_id: r.session_id,
	match_number: r.match_number,
	status: (r.status ?? "pending") as MatchDbStatus,
	started_at: r.started_at ? r.started_at.toISOString() : null,
});

const toParticipant = (r: Row<typeof match_participants>): MatchParticipant => ({
	id: r.id,
	match_id: r.match_id,
	player_id: r.player_id,
	team_id: r.team_id,
});

const toScoreEntry = (r: Row<typeof score_entries>): ScoreEntry => ({
	id: r.id,
	player_id: r.player_id,
	match_id: r.match_id,
	hole_number: r.hole_number,
	strokes: r.strokes,
	created_at: r.created_at.toISOString(),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** GET /api/tournaments — list all tournaments. */
export const getAllTournaments: Handler = async (_req, res) => {
	try {
		const rows = await db.select().from(tournaments);
		res.json(rows.map(toTournament));
	} catch (err) {
		console.error("getAllTournaments failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};

/** GET /api/tournaments/:id — one tournament with teams, players, and sessions
 *  (each session nesting its matches, each match nesting its participants). */
export const getTournamentById: Handler = async (req, res) => {
	try {
		const id = req.params.id;
		if (typeof id !== "string") {
			res.status(400).json({ error: "Invalid tournament id" });
			return;
		}
		const [tournamentRow] = await db
			.select()
			.from(tournaments)
			.where(eq(tournaments.id, id));
		if (!tournamentRow) {
			res.status(404).json({ error: "Tournament not found" });
			return;
		}

		const [teamRows, playerRows, sessionRows] = await Promise.all([
			db.select().from(teams).where(eq(teams.tournament_id, id)),
			db.select().from(players).where(eq(players.tournament_id, id)),
			db
				.select()
				.from(sessions)
				.where(eq(sessions.tournament_id, id))
				.orderBy(sessions.sort_order),
		]);

		const sessionIds = sessionRows.map((s) => s.id);
		const matchRows = sessionIds.length
			? await db.select().from(matches).where(inArray(matches.session_id, sessionIds))
			: [];

		const matchIds = matchRows.map((m) => m.id);
		const participantRows = matchIds.length
			? await db
					.select()
					.from(match_participants)
					.where(inArray(match_participants.match_id, matchIds))
			: [];

		// Group children by parent id for assembly.
		const participantsByMatch = new Map<string, MatchParticipant[]>();
		for (const row of participantRows) {
			const list = participantsByMatch.get(row.match_id) ?? [];
			list.push(toParticipant(row));
			participantsByMatch.set(row.match_id, list);
		}

		const matchesBySession = new Map<string, MatchWithParticipants[]>();
		for (const row of matchRows) {
			const list = matchesBySession.get(row.session_id) ?? [];
			list.push({
				...toMatch(row),
				participants: participantsByMatch.get(row.id) ?? [],
			});
			matchesBySession.set(row.session_id, list);
		}

		const sessionsOut: SessionWithMatches[] = sessionRows.map((row) => ({
			...toSession(row),
			matches: matchesBySession.get(row.id) ?? [],
		}));

		const detail: TournamentDetail = {
			...toTournament(tournamentRow),
			teams: teamRows.map(toTeam),
			players: playerRows.map(toPlayer),
			sessions: sessionsOut,
		};

		res.json(detail);
	} catch (err) {
		console.error("getTournamentById failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};

/** POST /api/matches/:id/scores — record (or correct) a player's score for a
 *  hole. Upserts on the (player, match, hole) unique index so re-entry from the
 *  course overwrites cleanly. */
export const createMatchScore: Handler = async (req, res) => {
	try {
		const matchId = req.params.id;
		if (typeof matchId !== "string") {
			res.status(400).json({ error: "Invalid match id" });
			return;
		}
		const { player_id, hole_number, strokes } = req.body ?? {};

		if (
			typeof player_id !== "string" ||
			typeof hole_number !== "number" ||
			typeof strokes !== "number"
		) {
			res.status(400).json({
				error: "player_id (string), hole_number (number), strokes (number) are required",
			});
			return;
		}

		const [row] = await db
			.insert(score_entries)
			.values({ player_id, match_id: matchId, hole_number, strokes })
			.onConflictDoUpdate({
				target: [
					score_entries.player_id,
					score_entries.match_id,
					score_entries.hole_number,
				],
				set: { strokes },
			})
			.returning();

		if (!row) {
			res.status(500).json({ error: "Failed to record score" });
			return;
		}

		res.status(201).json(toScoreEntry(row));
	} catch (err) {
		console.error("createMatchScore failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};
