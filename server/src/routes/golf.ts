import type { Handler } from "express";
import type {
	MatchParticipant,
	MatchScorecard,
	MatchWithParticipants,
	ScorecardSide,
	SessionWithMatches,
	TournamentDetail,
} from "@golf/shared";
import * as repo from "../repositories/golf";

// ---------------------------------------------------------------------------
// Handlers — parse the request, call the repository, assemble the response.
// No SQL lives here; queries belong in ../repositories/golf.
// ---------------------------------------------------------------------------

// The id columns are Postgres uuid; querying them with a non-uuid string throws
// a DB error (→ 500). Reject malformed ids up front as a 400 instead.
const UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

/** GET /api/tournaments — list all tournaments. */
export const getAllTournaments: Handler = async (_req, res) => {
	try {
		res.json(await repo.listTournaments());
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
		if (!isUuid(id)) {
			res.status(400).json({ error: "Invalid tournament id" });
			return;
		}

		const tournament = await repo.getTournament(id);
		if (!tournament) {
			res.status(404).json({ error: "Tournament not found" });
			return;
		}

		const [teams, players, sessions] = await Promise.all([
			repo.getTeamsByTournament(id),
			repo.getPlayersByTournament(id),
			repo.getSessionsByTournament(id),
		]);

		const matches = await repo.getMatchesBySessions(sessions.map((s) => s.id));
		const participants = await repo.getParticipantsByMatches(matches.map((m) => m.id));

		// Group children by parent id for assembly.
		const participantsByMatch = new Map<string, MatchParticipant[]>();
		for (const p of participants) {
			const list = participantsByMatch.get(p.match_id) ?? [];
			list.push(p);
			participantsByMatch.set(p.match_id, list);
		}

		const matchesBySession = new Map<string, MatchWithParticipants[]>();
		for (const m of matches) {
			const list = matchesBySession.get(m.session_id) ?? [];
			list.push({ ...m, participants: participantsByMatch.get(m.id) ?? [] });
			matchesBySession.set(m.session_id, list);
		}

		const sessionsOut: SessionWithMatches[] = sessions.map((s) => ({
			...s,
			matches: matchesBySession.get(s.id) ?? [],
		}));

		const detail: TournamentDetail = {
			...tournament,
			teams,
			players,
			sessions: sessionsOut,
		};

		res.json(detail);
	} catch (err) {
		console.error("getTournamentById failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};

/** GET /api/matches/:id/scores — self-contained scorecard for one match:
 *  both sides with pairing names + hole-by-hole strokes, and the course pars.
 *  Course holes live on the tournament, so resolve match → session → tournament
 *  before loading them. */
export const getMatchScores: Handler = async (req, res) => {
	try {
		const id = req.params.id;
		if (!isUuid(id)) {
			res.status(400).json({ error: "Invalid match id" });
			return;
		}

		const match = await repo.getMatch(id);
		if (!match) {
			res.status(404).json({ error: "Match not found" });
			return;
		}
		const session = await repo.getSession(match.session_id);
		if (!session) {
			res.status(404).json({ error: "Session not found" });
			return;
		}

		const [participants, scores, holes, players, teams] = await Promise.all([
			repo.getParticipantsByMatch(id),
			repo.getScoreEntriesByMatch(id),
			repo.getCourseHoles(session.tournament_id),
			repo.getPlayersByTournament(session.tournament_id),
			repo.getTeamsByTournament(session.tournament_id),
		]);

		const playerName = new Map(players.map((p) => [p.id, p.name]));
		const teamName = new Map(teams.map((t) => [t.id, t.name]));
		// Hole order is defined by `holes` (repo returns them by hole_number).
		const indexByHole = new Map(holes.map((h, i) => [h.hole_number, i]));
		const pars = holes.map((h) => h.par);

		// One side per team, in first-seen participant order (so teamIndex 0/1 is
		// stable for the client).
		const sideByTeam = new Map<string, ScorecardSide>();
		for (const p of participants) {
			let side = sideByTeam.get(p.team_id);
			if (!side) {
				side = {
					team_id: p.team_id,
					team_name: teamName.get(p.team_id) ?? "",
					players: [],
					strokes: holes.map(() => null),
				};
				sideByTeam.set(p.team_id, side);
			}
			const name = playerName.get(p.player_id);
			if (name) side.players.push(name);
		}

		// Fold each score into its side's strokes array (best ball on ties).
		for (const s of scores) {
			const teamId =
				s.team_id ??
				participants.find((p) => p.player_id === s.player_id)?.team_id;
			if (!teamId) continue;
			const side = sideByTeam.get(teamId);
			const i = indexByHole.get(s.hole_number);
			if (!side || i === undefined) continue;
			const current = side.strokes[i];
			side.strokes[i] = current == null ? s.strokes : Math.min(current, s.strokes);
		}

		const scorecard: MatchScorecard = {
			match_id: id,
			session_name: session.name,
			match_number: match.match_number,
			pars,
			sides: [...sideByTeam.values()],
		};

		res.json(scorecard);
	} catch (err) {
		console.error("getMatchScores failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};

/** POST /api/matches/:id/scores — record (or correct) a score for a hole. */
export const createMatchScore: Handler = async (req, res) => {
	try {
		const matchId = req.params.id;
		if (!isUuid(matchId)) {
			res.status(400).json({ error: "Invalid match id" });
			return;
		}
		const { player_id, team_id, hole_number, strokes } = req.body ?? {};

		if (typeof hole_number !== "number" || typeof strokes !== "number") {
			res.status(400).json({
				error: "hole_number (number) and strokes (number) are required",
			});
			return;
		}

		// Exactly one of player_id / team_id must be present (mirrors the DB XOR
		// check + partial unique indexes).
		const hasPlayer = typeof player_id === "string";
		const hasTeam = typeof team_id === "string";
		if (hasPlayer === hasTeam) {
			res.status(400).json({
				error: "exactly one of player_id or team_id (string) is required",
			});
			return;
		}

		const entry = await repo.upsertScore({
			player_id: hasPlayer ? player_id : null,
			team_id: hasTeam ? team_id : null,
			match_id: matchId,
			hole_number,
			strokes,
		});

		if (!entry) {
			res.status(500).json({ error: "Failed to record score" });
			return;
		}

		res.status(201).json(entry);
	} catch (err) {
		console.error("createMatchScore failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
};
