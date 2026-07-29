// ---------------------------------------------------------------------------
// HARDCODED FIXTURE — remove once the scores endpoint is read back per match.
// No read route for hole-by-hole scores exists yet, so this backs a static
// scorecard. Replace `PARS` / `ROUNDS` with `CourseHole[]` + `ScoreEntry[]`
// fetched for the match, grouped by hole_number.
// ---------------------------------------------------------------------------

export const PARS = [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];

export const FRONT = [0, 1, 2, 3, 4, 5, 6, 7, 8];
export const BACK = [9, 10, 11, 12, 13, 14, 15, 16, 17];

export interface ScorecardPlayer {
  name: string;
  strokes: (number | null)[];
}

export interface RoundCard {
  id: string;
  name: string;
  matchLabel: string;
  players: ScorecardPlayer[];
}

export const ROUNDS: RoundCard[] = [
  {
    id: "s1",
    name: "Foursomes",
    matchLabel: "Match 1",
    players: [
      { name: "Scheffler / Cantlay", strokes: [4, 5, 4, 2, 4, 4, 4, 3, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5] },
      { name: "McIlroy / Fleetwood", strokes: [5, 5, 4, 3, 5, 4, 5, 3, 4, 4, 5, 3, 5, 5, 4, 4, 4, 5] },
    ],
  },
  {
    id: "s2",
    name: "Fourball",
    matchLabel: "Match 1",
    players: [
      { name: "Scheffler / Schauffele", strokes: [4, 4, 3, 3, 4, 4, 5, 2, 4, 4, null, null, null, null, null, null, null, null] },
      { name: "McIlroy / Rahm", strokes: [4, 5, 4, 3, 4, 3, 5, 3, 4, 5, null, null, null, null, null, null, null, null] },
    ],
  },
];

export const getRound = (matchId: string | undefined): RoundCard =>
  ROUNDS.find((r) => r.id === matchId) ?? ROUNDS[0];

export const sumAt = (strokes: (number | null)[], holes: number[]) =>
  holes.reduce<number>((sum, i) => sum + (strokes[i] ?? 0), 0);

const ALL = PARS.map((_, i) => i);

export const relToPar = (strokes: (number | null)[]) => {
  const diff = ALL.reduce<number>(
    (acc, i) => (strokes[i] === null ? acc : acc + (strokes[i] as number) - PARS[i]),
    0,
  );
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

// Match-play running status for a two-player match: "AS" when all square,
// otherwise the leader's name with how many holes they're up (e.g. "1↑").
export const matchStatus = (players: ScorecardPlayer[]): string => {
  if (players.length !== 2) return "AS";
  let lead = 0; // positive => players[0] is up
  for (let i = 0; i < PARS.length; i++) {
    const a = players[0].strokes[i];
    const b = players[1].strokes[i];
    if (a === null || b === null) continue;
    if (a < b) lead += 1;
    else if (b < a) lead -= 1;
  }
  if (lead === 0) return "AS";
  const leader = lead > 0 ? players[0] : players[1];
  return `${leader.name} ${Math.abs(lead)}↑`;
};
