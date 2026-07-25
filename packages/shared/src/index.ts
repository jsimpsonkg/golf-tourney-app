/**
 * Shared domain contract for the golf tournament app.
 *
 * Single source of truth for the JSON shapes the API returns and the scoring
 * engine produces. Imported by both `client` and `server` via `@golf/shared`.
 */

// ---------------------------------------------------------------------------
// Entities (mirror the Drizzle schema, serialized to JSON)
// ---------------------------------------------------------------------------

export interface Tournament {
	id: string;
	name: string;
	start_date: string | null; // ISO timestamp
	image_url: string | null; // path or URL for the tournament's card image
	format: string | null; // e.g. 'rydercup', 'strokeplay'
	settings: Record<string, unknown>;
	created_at: string;
}

export interface Team {
	id: string;
	tournament_id: string;
	name: string;
}

export interface Player {
	id: string;
	name: string;
	tournament_id: string;
	team_id: string | null;
}

export interface Session {
	id: string;
	tournament_id: string;
	name: string | null;
	session_type: string | null; // 'foursomes' | 'fourball' | 'singles' | ...
	point_value: number; // points a single match in this session is worth
	sort_order: number;
}

export type MatchDbStatus = "pending" | "in_progress" | "completed";

export interface Match {
	id: string;
	session_id: string;
	match_number: number | null;
	status: MatchDbStatus;
	started_at: string | null;
}

export interface MatchParticipant {
	id: string;
	match_id: string;
	player_id: string;
	team_id: string;
}

export interface Course {
	id: string;
	name: string;
}

export interface CourseHole {
	id: string;
	tournament_id: string;
	course_id: string;
	hole_number: number;
	par: number;
	stroke_index: number | null;
	yardage: number | null;
}

export interface ScoreEntry {
	id: string;
	player_id: string | null;
	team_id: string | null;
	match_id: string | null;
	hole_number: number;
	strokes: number;
	created_at: string;
}

// ---------------------------------------------------------------------------
// Nested read shapes returned by the API
// ---------------------------------------------------------------------------

export interface SessionWithMatches extends Session {
	matches: MatchWithParticipants[];
}

export interface MatchWithParticipants extends Match {
	participants: MatchParticipant[];
}

export interface TournamentDetail extends Tournament {
	teams: Team[];
	players: Player[];
	sessions: SessionWithMatches[];
}

// ---------------------------------------------------------------------------
// Computed scoring shapes (produced by the scoring engine)
// ---------------------------------------------------------------------------

export type MatchState = "not_started" | "in_progress" | "completed";

/** Points awarded to one team for a completed (or halved) match. */
export interface MatchPoints {
	team_id: string;
	points: number;
}

/**
 * Result of interpreting a single match's hole-by-hole scores through a
 * match-play lens.
 */
export interface MatchResult {
	match_id: string;
	state: MatchState;
	/** Team currently ahead; null when all-square / halved. */
	leading_team_id: string | null;
	/** How many holes the leading team is up (0 = all square). */
	holes_up: number;
	/** Holes both sides have completed. */
	holes_played: number;
	/** Human-readable status, e.g. "3&2", "2 up", "AS", "1 up thru 14". */
	status_label: string;
	/** Points once decided/halved; null while still in progress. */
	points: MatchPoints[] | null;
}

export interface TeamStanding {
	team_id: string;
	team_name: string;
	points: number;
}

/** Everything the live leaderboard view needs, per tournament. */
export interface LeaderboardView {
	tournament_id: string;
	standings: TeamStanding[];
	matches: MatchResult[];
}
