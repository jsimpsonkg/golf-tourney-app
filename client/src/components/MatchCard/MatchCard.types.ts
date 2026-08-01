import type { MatchState } from "@golf/shared";

/** UI convention for the two teams: left column (A) and right column (B).
 *  Mapped from each participant's team_id in RoundLeaderboard — not stored on
 *  the data. */
export type Side = "A" | "B";

/** One line of the center pill. The front and back nine are scored separately,
 *  so each gets its own line rather than being joined into one string. */
export interface MatchStatusLine {
  /** Row prefix, e.g. "F9" / "B9". Null renders the value on its own. */
  label: string | null;
  /** e.g. "3&2", "2 up thru 5", "AS", "—". */
  value: string;
}

/** A single match, flattened into what the card needs to render. */
export interface LeaderboardMatchRow {
  matchId: string;
  matchNumber: number | null;
  /** Player names per side, e.g. { A: ["Scheffler", "Cantlay"], B: [...] }. */
  players: Record<Side, string[]>;
  state: MatchState;
  /** Center pill contents, one entry per line. */
  statusLines: MatchStatusLine[];
  /** Side currently ahead, or null when all-square / not yet started. */
  leader: Side | null;
}
