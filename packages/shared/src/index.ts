// JSON shapes shared by the client and server (imported via @golf/shared).

// --- Entities (mirror the Drizzle schema) ---

export interface Tournament {
  id: string;
  name: string;
  start_date: string | null;
  image_url: string | null;
  format: string | null; // 'rydercup', 'strokeplay', etc.
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
  point_value: number; // points one match here is worth
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
  course_id: string | null;
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

// --- Nested read shapes returned by the API ---

export interface SessionWithMatches extends Session {
  matches: MatchWithParticipants[];
  standings: TeamStanding[];
}

export interface MatchWithParticipants extends Match {
  participants: MatchParticipant[];
}

export interface TournamentDetail extends Tournament {
  teams: Team[];
  players: Player[];
  sessions: SessionWithMatches[];
  standings: TeamStanding[]; // overall, best first
}

// Rounds view: GET /api/tournaments/:id/rounds
// Sessions + matches with named participants, plus teams so the client can
// order sides (A/B) consistently.

export interface NamedParticipant extends MatchParticipant {
  player_name: string;
}

export interface MatchWithNamedParticipants extends Match {
  participants: NamedParticipant[];
}

export interface RoundMatch extends MatchWithNamedParticipants {
  result: MatchResult;
}

export interface RoundSession extends Session {
  matches: RoundMatch[];
  standings: TeamStanding[];
}

export interface RoundsView {
  teams: Team[];
  sessions: RoundSession[];
}

// --- Computed scoring shapes ---

export type MatchState = "not_started" | "in_progress" | "completed";

export interface MatchPoints {
  team_id: string;
  points: number;
}

export interface MatchResult {
  match_id: string;
  state: MatchState;
  leading_team_id: string | null; // null when all-square
  holes_up: number;
  holes_played: number;
  status_label: string; // "3&2", "2 up", "AS", "1 up thru 14", ...
  points: MatchPoints[] | null; // null while in progress
}

export interface TeamStanding {
  team_id: string;
  team_name: string;
  points: number;
}

export interface LeaderboardView {
  tournament_id: string;
  standings: TeamStanding[];
  matches: MatchResult[];
}

// --- Scorecard view (one match, both sides) ---
// Self-contained for the ViewScores/TeamScores pages, which only have a matchId.

export interface ScorecardSide {
  team_id: string;
  team_name: string;
  players: string[];
  // One score per hole, in `pars` order; null until entered.
  // Best ball (lowest) when multiple players score a hole.
  strokes: (number | null)[];
}

export interface MatchScorecard {
  match_id: string;
  tournament_id: string;
  session_name: string | null;
  match_number: number | null;
  pars: number[];
  hole_numbers: number[];
  sides: ScorecardSide[];
  result: MatchResult;
}

// --- Score entry (POST /api/matches/:id/scores) ---

export interface ScoreEntryInput {
  player_id?: string | null;
  team_id?: string | null;
  hole_number: number;
  strokes: number | null;
}

export interface SaveScoresRequest {
  entries: ScoreEntryInput[];
}

export interface SaveScoresResponse {
  saved: ScoreEntry[];
  deleted: number;
}

// --- Team page view ---

export interface TeamPageInfo {
  team: Team;
  points: number;
  players: Player[];
  sessions: RoundSession[];
  teams: Team[]; // all teams, for the team-switch tabs
}
