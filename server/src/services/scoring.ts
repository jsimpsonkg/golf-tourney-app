// Pure match-play scoring. No DB or HTTP — callers load the rows and pass them
// in, which keeps this easy to test.
import type {
  CourseHole,
  MatchParticipant,
  MatchResult,
  ScoreEntry,
  Session,
  Team,
  LeaderboardView,
  MatchPoints,
  TeamStanding,
} from "@golf/shared";

export interface MatchScoringInput {
  match_id: string;
  participants: MatchParticipant[];
  scores: ScoreEntry[];
  holes: CourseHole[];
  point_value: number; // what this match is worth, from its session
}

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
    };
  }

  // Walk holes both sides finished. net is signed: + means A is up, - means B.
  let net = 0;
  let holesPlayed = 0;
  for (let i = 0; i < holes.length; i++) {
    const sa = a[i];
    const sb = b[i];
    if (sa == null || sb == null) continue;
    holesPlayed++;
    if (sa < sb) net++;
    else if (sb < sa) net--;
  }

  const lead = Math.abs(net);
  const holesRemaining = holes.length - holesPlayed;
  const allPlayed = holesRemaining === 0;
  // A match ends once the lead can't be caught (the "3&2" case); level after
  // the last hole is a halve.
  const decided = holesPlayed > 0 && lead > holesRemaining;
  const completed = decided || (holesPlayed > 0 && allPlayed);

  const state: MatchResult["state"] =
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
    statusLabel = net === 0 ? `AS thru ${holesPlayed}` : `${lead} up thru ${holesPlayed}`;
  }

  let points: MatchPoints[] | null = null;
  if (completed) {
    if (net === 0) {
      // Halved — split the points.
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
    match_id,
    state,
    leading_team_id: leadingTeamId,
    holes_up: lead,
    holes_played: holesPlayed,
    status_label: statusLabel,
    points,
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
