import type { MatchResult, NineResult } from "@golf/shared";

/** One display row per nine — the front and back are scored separately, so
 *  they're shown on separate lines rather than joined into one string. */
export interface NineStatusRow {
  /** "Front 9" / "Back 9". */
  label: string;
  /** Compact form for narrow cells: "F9" / "B9". */
  shortLabel: string;
  /** "3&2", "AS", "2 up thru 5", "—" before play starts. */
  status: string;
  /** Team ahead on this nine, or null when level / not started. */
  leadingTeamId: string | null;
  state: NineResult["state"];
}

/** Whole points render bare ("1"), halves keep one decimal ("0.5"). */
export const formatPoints = (n: number) =>
  Number.isInteger(n) ? `${n}` : n.toFixed(1);

const SHORT: Record<string, string> = {
  "Front 9": "F9",
  "Back 9": "B9",
};

export const toNineRows = (result: MatchResult): NineStatusRow[] =>
  result.nines.map((n) => ({
    label: n.label,
    shortLabel: SHORT[n.label] ?? n.label,
    // A nine nobody has teed off on shows a dash, not "Not started" — the
    // card's own state pill already says the match hasn't begun.
    status: n.state === "not_started" ? "—" : n.status_label,
    leadingTeamId: n.leading_team_id,
    state: n.state,
  }));

/** Points won per team across every decided nine. */
export const pointsByTeam = (result: MatchResult) => {
  const totals = new Map<string, number>();
  for (const p of result.points ?? []) {
    totals.set(p.team_id, (totals.get(p.team_id) ?? 0) + p.points);
  }
  return totals;
};
