import type { ScorecardSide } from "@golf/shared";

// Sum a side's strokes (or the pars) over a set of hole indices.
export const sumAt = (values: (number | null)[], holes: number[]) =>
  holes.reduce<number>((sum, i) => sum + (values[i] ?? 0), 0);

// Total strokes relative to par, over the holes played so far.
export const relToPar = (strokes: (number | null)[], pars: number[]) => {
  const diff = pars.reduce<number>(
    (acc, par, i) =>
      strokes[i] == null ? acc : acc + (strokes[i] as number) - par,
    0,
  );
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

// Match-play running status for a two-sided match: "AS" when all square,
// otherwise the leading side with how many holes they're up (e.g. "Team A 2 up").
// Only counts holes both sides have completed.
export const matchStatus = (sides: ScorecardSide[]): string => {
  if (sides.length !== 2) return "AS";
  let lead = 0; // positive => sides[0] is up
  const [a, b] = sides;
  for (let i = 0; i < a.strokes.length; i++) {
    const sa = a.strokes[i];
    const sb = b.strokes[i];
    if (sa == null || sb == null) continue;
    if (sa < sb) lead += 1;
    else if (sb < sa) lead -= 1;
  }
  if (lead === 0) return "AS";
  const leader = lead > 0 ? a : b;
  const label = leader.team_name || leader.players.join(" / ");
  return `${label} ${Math.abs(lead)} up`;
};
