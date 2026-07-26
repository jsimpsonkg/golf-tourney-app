/**
 * Scoring engine — pure functions that interpret hole-by-hole scores through a
 * match-play lens. No DB or HTTP here: callers (route handlers) load rows via
 * ../repositories/golf and pass them in, so this stays trivially testable.
 *
 * TODO: implement. Signatures below match the computed shapes in @golf/shared.
 */
import type {
	CourseHole,
	MatchParticipant,
	MatchResult,
	ScoreEntry,
	Session,
	Team,
	LeaderboardView,
} from "@golf/shared";

export interface MatchScoringInput {
	match_id: string;
	participants: MatchParticipant[];
	scores: ScoreEntry[];
	holes: CourseHole[];
	/** Points this match is worth (from its session). */
	point_value: number;
}

/** Interpret one match's scores into holes-up / status / points. */
export const computeMatchResult = (_input: MatchScoringInput): MatchResult => {
	throw new Error("computeMatchResult: not implemented");
};

export interface LeaderboardInput {
	tournament_id: string;
	teams: Team[];
	sessions: Session[];
	matches: MatchScoringInput[];
}

/** Roll individual match results up into per-team standings. */
export const computeLeaderboard = (_input: LeaderboardInput): LeaderboardView => {
	throw new Error("computeLeaderboard: not implemented");
};
