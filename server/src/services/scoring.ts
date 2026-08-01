// Pure match-play scoring. No DB or HTTP — callers load the rows and pass them
// in, which keeps this easy to test.
//
// A match is scored as two independent nines. Each nine is worth half the
// match's point_value, so a match worth 2 pays 1 for the front and 1 for the
// back, and a nine that finishes level splits its half.
import type {
  CourseHole,
  MatchParticipant,
  MatchResult,
  NineResult,
  ScoreEntry,
  Session,
  Team,
  LeaderboardView,
  MatchPoints,
  MatchState,
  TeamStanding,
} from "@golf/shared";

export interface MatchScoringInput {
  match_id: string;
  participants: MatchParticipant[];
  scores: ScoreEntry[];
  holes: CourseHole[];
  point_value: number; // what this match is worth, from its session
}

const HOLES_PER_NINE = 9;

// Score one segment of holes as a self-contained match-play contest.
// `a` / `b` are per-hole strokes for the segment; null = not played yet.
const scoreNine = (
  label: string,
  a: (number | null)[],
  b: (number | null)[],
  teamAId: string,
  teamBId: string,
  point_value: number,
): NineResult => {
  // Walk holes both sides finished. net is signed: + means A is up, - means B.
  let net = 0;
  let holesPlayed = 0;
  for (let i = 0; i < a.length; i++) {
    const sa = a[i];
    const sb = b[i];
    if (sa == null || sb == null) continue;
    holesPlayed++;
    if (sa < sb) net++;
    else if (sb < sa) net--;
  }

  const lead = Math.abs(net);
  const holesRemaining = a.length - holesPlayed;
  const allPlayed = holesRemaining === 0;
  // A nine ends once the lead can't be caught (the "3&2" case); level after
  // the last hole is a halve.
  const decided = holesPlayed > 0 && lead > holesRemaining;
  const completed = decided || (holesPlayed > 0 && allPlayed);

  const state: MatchState =
    holesPlayed === 0 ? "not_started" : completed ? "completed" : "in_progress";

  const leadingTeamId = net > 0 ? teamAId : net < 0 ? teamBId : null;

  let statusLabel: string;
  if (holesPlayed === 0) {
    statusLabel = "Not started";
  } else if (completed) {
    if (net === 0) statusLabel = "AS";
    else if (allPlayed) statusLabel = `${lead} up`;
    else statusLabel = `${lead}&${holesRemaining}`;
  } else {
    statusLabel =
      net === 0 ? `AS thru ${holesPlayed}` : `${lead} up thru ${holesPlayed}`;
  }

  let points: MatchPoints[] | null = null;
  if (completed) {
    if (net === 0) {
      // Halved — split this nine's points.
      points = [
        { team_id: teamAId, points: point_value / 2 },
        { team_id: teamBId, points: point_value / 2 },
      ];
    } else {
      const winner = net > 0 ? teamAId : teamBId;
      const loser = net > 0 ? teamBId : teamAId;
      points = [
        { team_id: winner, points: point_value },
        { team_id: loser, points: 0 },
      ];
    }
  }

  return {
    label,
    state,
    leading_team_id: leadingTeamId,
    holes_up: lead,
    holes_played: holesPlayed,
    status_label: statusLabel,
    points,
  };
};

export const computeMatchResult = ({
  match_id,
  participants,
  scores,
  holes,
  point_value,
}: MatchScoringInput): MatchResult => {
  const teamIds = [...new Set(participants.map((p) => p.team_id))];
  const holeIndex = new Map(holes.map((h, i) => [h.hole_number, i]));

  // Per-team best-ball strokes, indexed to `holes` order; null = no score yet.
  const strokesByTeam = new Map<string, (number | null)[]>();
  for (const teamId of teamIds) {
    strokesByTeam.set(
      teamId,
      holes.map(() => null),
    );
  }

  for (const s of scores) {
    const teamId =
      s.team_id ??
      participants.find((p) => p.player_id === s.player_id)?.team_id;
    const i = teamId != null ? holeIndex.get(s.hole_number) : undefined;
    if (teamId == null || i === undefined) continue;

    const arr = strokesByTeam.get(teamId);
    if (!arr) continue;
    const current = arr[i];
    // Lowest score on the side counts.
    arr[i] = current == null ? s.strokes : Math.min(current, s.strokes);
  }

  const [teamAId, teamBId] = teamIds;
  const a = teamAId != null ? strokesByTeam.get(teamAId) : undefined;
  const b = teamBId != null ? strokesByTeam.get(teamBId) : undefined;

  // Need two sides to score a match; until then it's just not started.
  if (teamAId == null || teamBId == null || !a || !b) {
    return {
      match_id,
      state: "not_started",
      leading_team_id: null,
      holes_up: 0,
      holes_played: 0,
      status_label: "Not started",
      points: null,
      nines: [],
      total_holes_played: 0,
    };
  }

  // Split into nines. An 18-hole card gives Front/Back; a 9-hole card gives a
  // single segment that takes the whole point value, and any odd remainder
  // (a 27-hole day) becomes its own segment rather than being dropped.
  const segmentCount = Math.max(1, Math.ceil(holes.length / HOLES_PER_NINE));
  const pointsPerNine = point_value / segmentCount;

  const nines: NineResult[] = [];
  for (let seg = 0; seg < segmentCount; seg++) {
    const start = seg * HOLES_PER_NINE;
    const end = Math.min(start + HOLES_PER_NINE, holes.length);
    const label =
      segmentCount === 1
        ? "Match"
        : seg === 0
          ? "Front 9"
          : seg === 1
            ? "Back 9"
            : `Holes ${start + 1}-${end}`;
    nines.push(
      scoreNine(
        label,
        a.slice(start, end),
        b.slice(start, end),
        teamAId,
        teamBId,
        pointsPerNine,
      ),
    );
  }

  const totalHolesPlayed = nines.reduce((n, x) => n + x.holes_played, 0);

  // Overall state: completed only once every nine is done.
  const state: MatchState =
    totalHolesPlayed === 0
      ? "not_started"
      : nines.every((n) => n.state === "completed")
        ? "completed"
        : "in_progress";

  // Bank points from every decided nine, even mid-match.
  const banked = new Map<string, number>();
  let anyDecided = false;
  for (const n of nines) {
    if (!n.points) continue;
    anyDecided = true;
    for (const p of n.points) {
      banked.set(p.team_id, (banked.get(p.team_id) ?? 0) + p.points);
    }
  }
  const points: MatchPoints[] | null = anyDecided
    ? [teamAId, teamBId].map((team_id) => ({
        team_id,
        points: banked.get(team_id) ?? 0,
      }))
    : null;

  // The "active" nine drives the headline status: the one in progress, else the
  // last one with holes played, else the first.
  // `nines` always has at least one segment, so this is never undefined.
  const active: NineResult =
    nines.find((n) => n.state === "in_progress") ??
    [...nines].reverse().find((n) => n.holes_played > 0) ??
    nines[0]!;

  let statusLabel: string;
  if (state === "not_started") {
    statusLabel = "Not started";
  } else if (segmentCount === 1) {
    statusLabel = active.status_label;
  } else if (state === "completed") {
    // Both nines done — report the split, e.g. "Front 9: 3&2 · Back 9: AS".
    statusLabel = nines.map((n) => `${n.label}: ${n.status_label}`).join(" · ");
  } else {
    statusLabel = `${active.label}: ${active.status_label}`;
  }

  return {
    match_id,
    state,
    leading_team_id: active.leading_team_id,
    holes_up: active.holes_up,
    holes_played: active.holes_played,
    status_label: statusLabel,
    points,
    nines,
    total_holes_played: totalHolesPlayed,
  };
};

export interface LeaderboardInput {
  tournament_id: string;
  teams: Team[];
  sessions: Session[];
  matches: MatchScoringInput[];
}

// Roll match results up into per-team standings.
export const computeLeaderboard = (
  input: LeaderboardInput,
): LeaderboardView => {
  const results = input.matches.map(computeMatchResult);

  const pointsByTeam = new Map<string, number>();
  for (const t of input.teams) pointsByTeam.set(t.id, 0);

  for (const r of results) {
    if (!r.points) continue;
    for (const p of r.points) {
      pointsByTeam.set(p.team_id, (pointsByTeam.get(p.team_id) ?? 0) + p.points);
    }
  }

  const standings: TeamStanding[] = input.teams
    .map((t) => ({
      team_id: t.id,
      team_name: t.name,
      points: pointsByTeam.get(t.id) ?? 0,
    }))
    .sort((x, y) => y.points - x.points);

  return {
    tournament_id: input.tournament_id,
    standings,
    matches: results,
  };
};
