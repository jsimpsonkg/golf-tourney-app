// Assembles the "rounds" read model: loads a tournament's matches and turns
// them into RoundMatches (named participants + match result), grouped into
// RoundSessions with standings. Glues the repositories to the scoring engine so
// the route handlers stay thin — unlike ./scoring, this one hits the DB.
import type {
  CourseHole,
  NamedParticipant,
  Player,
  RoundMatch,
  RoundSession,
  ScoreEntry,
  Session,
  Team,
  TeamStanding,
} from "@golf/shared";
import * as repo from "../repositories/golf";
import { holesBySession } from "./courses";
import {
  computeLeaderboard,
  computeMatchResult,
  type MatchScoringInput,
} from "./scoring";

const groupScoresByMatch = (
  scores: ScoreEntry[],
): Map<string, ScoreEntry[]> => {
  const byMatch = new Map<string, ScoreEntry[]>();
  for (const s of scores) {
    if (!s.match_id) continue;
    const list = byMatch.get(s.match_id) ?? [];
    list.push(s);
    byMatch.set(s.match_id, list);
  }
  return byMatch;
};

// Everything the rounds/team read models need, loaded once.
export interface RoundData {
  tournamentId: string;
  teams: Team[];
  players: Player[];
  sessions: Session[];
  holes: CourseHole[]; // every course's holes; group per session via holesBySession
  holesBySession: Map<string, CourseHole[]>;
  matches: RoundMatch[];
  matchesBySession: Map<string, RoundMatch[]>;
  inputsBySession: Map<string, MatchScoringInput[]>; // for standings rollups
  overallStandings: TeamStanding[];
}

// Loads every match for a tournament and assembles the RoundMatches plus the
// maps needed to roll up standings. Pulled out of the handlers that all used
// to repeat this block.
export const loadRoundData = async (
  tournamentId: string,
): Promise<RoundData> => {
  const [teams, players, sessions] = await Promise.all([
    repo.getTeamsByTournament(tournamentId),
    repo.getPlayersByTournament(tournamentId),
    repo.getSessionsByTournament(tournamentId),
  ]);

  const matchRows = await repo.getMatchesBySessions(sessions.map((s) => s.id));
  const [participants, scores, holes] = await Promise.all([
    repo.getParticipantsByMatches(matchRows.map((m) => m.id)),
    repo.getScoreEntriesByMatches(matchRows.map((m) => m.id)),
    repo.getCourseHoles(tournamentId),
  ]);

  // Attach each player's name to their participant row.
  const playerNameById = new Map(players.map((p) => [p.id, p.name]));
  const participantsByMatch = new Map<string, NamedParticipant[]>();
  for (const p of participants) {
    const list = participantsByMatch.get(p.match_id) ?? [];
    list.push({ ...p, player_name: playerNameById.get(p.player_id) ?? "" });
    participantsByMatch.set(p.match_id, list);
  }

  const scoresByMatch = groupScoresByMatch(scores);
  const pointValueBySession = new Map(
    sessions.map((s) => [s.id, s.point_value]),
  );
  // Each round is scored against its own course, so a 71-par venue and a
  // 69-par one in the same tournament both compute correctly.
  const sessionHoles = holesBySession(sessions, holes);

  const matches: RoundMatch[] = [];
  const matchesBySession = new Map<string, RoundMatch[]>();
  const inputsBySession = new Map<string, MatchScoringInput[]>();

  for (const m of matchRows) {
    const matchParticipants = participantsByMatch.get(m.id) ?? [];
    const input: MatchScoringInput = {
      match_id: m.id,
      participants: matchParticipants,
      scores: scoresByMatch.get(m.id) ?? [],
      holes: sessionHoles.get(m.session_id) ?? [],
      point_value: m.point_value ?? pointValueBySession.get(m.session_id) ?? 0,
    };
    const roundMatch: RoundMatch = {
      ...m,
      participants: matchParticipants,
      result: computeMatchResult(input),
    };

    matches.push(roundMatch);
    const bySession = matchesBySession.get(m.session_id) ?? [];
    bySession.push(roundMatch);
    matchesBySession.set(m.session_id, bySession);

    const inputs = inputsBySession.get(m.session_id) ?? [];
    inputs.push(input);
    inputsBySession.set(m.session_id, inputs);
  }

  const overallStandings = computeLeaderboard({
    tournament_id: tournamentId,
    teams,
    sessions,
    matches: [...inputsBySession.values()].flat(),
  }).standings;

  return {
    tournamentId,
    teams,
    players,
    sessions,
    holes,
    holesBySession: sessionHoles,
    matches,
    matchesBySession,
    inputsBySession,
    overallStandings,
  };
};

export interface BuildRoundSessionsOptions {
  matchFilter?: (match: RoundMatch) => boolean; // narrows the matches shown, not the standings
  dropEmptySessions?: boolean;
}

// Turns RoundData into RoundSession[]. Standings always count every match in
// the session even when matchFilter narrows what's shown — so the team page
// can list one team's matches but still show the real session score.
export const buildRoundSessions = (
  data: RoundData,
  { matchFilter, dropEmptySessions }: BuildRoundSessionsOptions = {},
): RoundSession[] => {
  const out: RoundSession[] = [];
  for (const s of data.sessions) {
    const all = data.matchesBySession.get(s.id) ?? [];
    const matches = matchFilter ? all.filter(matchFilter) : all;
    if (dropEmptySessions && matches.length === 0) continue;
    out.push({
      ...s,
      matches,
      standings: computeLeaderboard({
        tournament_id: data.tournamentId,
        teams: data.teams,
        sessions: data.sessions,
        matches: data.inputsBySession.get(s.id) ?? [],
      }).standings,
    });
  }
  return out;
};
