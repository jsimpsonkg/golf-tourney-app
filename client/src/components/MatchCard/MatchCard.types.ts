import type { MatchState } from "@golf/shared";

/** UI convention for the two teams: left column (A) and right column (B).
 *  Mapped from each participant's team_id in RoundLeaderboard — not stored on
 *  the data. */
export type Side = "A" | "B";

/** A single match, flattened into what the card needs to render. */
export interface LeaderboardMatchRow {
  matchId: string;
  matchNumber: number | null;
  /** Player names per side, e.g. { A: ["Scheffler", "Cantlay"], B: [...] }. */
  players: Record<Side, string[]>;
  state: MatchState;
  /** Center pill text, e.g. "3&2", "2 up thru 14", "AS", or a placeholder. */
  statusLabel: string;
  /** Side currently ahead, or null when all-square / not yet started. */
  leader: Side | null;
}
