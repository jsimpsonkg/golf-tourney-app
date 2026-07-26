import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/index";
import {
  tournaments,
  teams,
  players,
  sessions,
  matches,
  match_participants,
  course_holes,
  score_entries,
} from "../db/schema";
import type {
  Tournament,
  Team,
  Player,
  Session,
  Match,
  MatchParticipant,
  CourseHole,
  ScoreEntry,
  MatchDbStatus,
} from "@golf/shared";

// ---------------------------------------------------------------------------
// Row → API-shape mappers (Drizzle returns Date/numeric-as-string; the shared
// contract is JSON-friendly, so normalize here).
// ---------------------------------------------------------------------------

type Row<T extends { $inferSelect: unknown }> = T["$inferSelect"];

const toTournament = (r: Row<typeof tournaments>): Tournament => ({
  id: r.id,
  name: r.name,
  start_date: r.start_date ? r.start_date.toISOString() : null,
  image_url: r.image_url,
  format: r.format,
  settings: (r.settings ?? {}) as Record<string, unknown>,
  created_at: r.created_at.toISOString(),
});

const toTeam = (r: Row<typeof teams>): Team => ({
  id: r.id,
  tournament_id: r.tournament_id,
  name: r.name,
});

const toPlayer = (r: Row<typeof players>): Player => ({
  id: r.id,
  name: r.name,
  tournament_id: r.tournament_id,
  team_id: r.team_id,
});

const toSession = (r: Row<typeof sessions>): Session => ({
  id: r.id,
  tournament_id: r.tournament_id,
  name: r.name,
  session_type: r.session_type,
  point_value: Number(r.point_value),
  sort_order: r.sort_order ?? 0,
});

const toMatch = (r: Row<typeof matches>): Match => ({
  id: r.id,
  session_id: r.session_id,
  match_number: r.match_number,
  status: (r.status ?? "pending") as MatchDbStatus,
  started_at: r.started_at ? r.started_at.toISOString() : null,
});

const toParticipant = (
  r: Row<typeof match_participants>,
): MatchParticipant => ({
  id: r.id,
  match_id: r.match_id,
  player_id: r.player_id,
  team_id: r.team_id,
});

const toCourseHole = (r: Row<typeof course_holes>): CourseHole => ({
  id: r.id,
  tournament_id: r.tournament_id,
  course_id: r.course_id,
  hole_number: r.hole_number,
  par: r.par,
  stroke_index: r.stroke_index,
  yardage: r.yardage,
});

const toScoreEntry = (r: Row<typeof score_entries>): ScoreEntry => ({
  id: r.id,
  player_id: r.player_id,
  team_id: r.team_id,
  match_id: r.match_id,
  hole_number: r.hole_number,
  strokes: r.strokes,
  created_at: r.created_at.toISOString(),
});

// ---------------------------------------------------------------------------
// Queries — each returns mapped domain objects, so callers never touch raw
// rows. Composed by the route handlers into the nested read shapes.
// ---------------------------------------------------------------------------

/** All tournaments, unordered. */
export const listTournaments = async (): Promise<Tournament[]> =>
  (await db.select().from(tournaments)).map(toTournament);

/** One tournament by id, or null if it doesn't exist. */
export const getTournament = async (id: string): Promise<Tournament | null> => {
  const [row] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id));
  return row ? toTournament(row) : null;
};

/** One match by id, or null. */
export const getMatch = async (id: string): Promise<Match | null> => {
  const [row] = await db.select().from(matches).where(eq(matches.id, id));
  return row ? toMatch(row) : null;
};

/** One session by id, or null. */
export const getSession = async (id: string): Promise<Session | null> => {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id));
  return row ? toSession(row) : null;
};

export const getTeamsByTournament = async (
  tournamentId: string,
): Promise<Team[]> =>
  (
    await db.select().from(teams).where(eq(teams.tournament_id, tournamentId))
  ).map(toTeam);

export const getPlayersByTournament = async (
  tournamentId: string,
): Promise<Player[]> =>
  (
    await db
      .select()
      .from(players)
      .where(eq(players.tournament_id, tournamentId))
  ).map(toPlayer);

export const getSessionsByTournament = async (
  tournamentId: string,
): Promise<Session[]> =>
  (
    await db
      .select()
      .from(sessions)
      .where(eq(sessions.tournament_id, tournamentId))
      .orderBy(sessions.sort_order)
  ).map(toSession);

export const getMatchesBySessions = async (
  sessionIds: string[],
): Promise<Match[]> =>
  sessionIds.length
    ? (
        await db
          .select()
          .from(matches)
          .where(inArray(matches.session_id, sessionIds))
      ).map(toMatch)
    : [];

/** Participants for a set of matches (used to nest under matches in bulk). */
export const getParticipantsByMatches = async (
  matchIds: string[],
): Promise<MatchParticipant[]> =>
  matchIds.length
    ? (
        await db
          .select()
          .from(match_participants)
          .where(inArray(match_participants.match_id, matchIds))
      ).map(toParticipant)
    : [];

/** Participants for a single match (scorecard view). */
export const getParticipantsByMatch = (
  matchId: string,
): Promise<MatchParticipant[]> => getParticipantsByMatches([matchId]);

/** Every recorded score for a match, hole order. */
export const getScoreEntriesByMatch = async (
  matchId: string,
): Promise<ScoreEntry[]> =>
  (
    await db
      .select()
      .from(score_entries)
      .where(eq(score_entries.match_id, matchId))
      .orderBy(score_entries.hole_number)
  ).map(toScoreEntry);

/** The tournament's holes (par / stroke index / yardage), hole order. */
export const getCourseHoles = async (
  tournamentId: string,
): Promise<CourseHole[]> =>
  (
    await db
      .select()
      .from(course_holes)
      .where(eq(course_holes.tournament_id, tournamentId))
      .orderBy(course_holes.hole_number)
  ).map(toCourseHole);

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export interface ScoreUpsert {
  /** Exactly one of player_id / team_id is set (mirrors the DB XOR check). */
  player_id: string | null;
  team_id: string | null;
  match_id: string;
  hole_number: number;
  strokes: number;
}

/**
 * Record (or correct) a score for a hole. A score belongs to *either* a player
 * (singles/four-ball) or a team/side (scramble/foursomes) — never both. Upserts
 * on the matching partial unique index so re-entry from the course overwrites
 * cleanly. Returns the persisted entry, or null if the insert produced no row.
 */
export const upsertScore = async (
  input: ScoreUpsert,
): Promise<ScoreEntry | null> => {
  const hasPlayer = input.player_id !== null;

  const conflict = hasPlayer
    ? {
        target: [
          score_entries.player_id,
          score_entries.match_id,
          score_entries.hole_number,
        ],
        targetWhere: sql`${score_entries.player_id} IS NOT NULL`,
        set: { strokes: input.strokes },
      }
    : {
        target: [
          score_entries.team_id,
          score_entries.match_id,
          score_entries.hole_number,
        ],
        targetWhere: sql`${score_entries.team_id} IS NOT NULL`,
        set: { strokes: input.strokes },
      };

  const [row] = await db
    .insert(score_entries)
    .values({
      player_id: input.player_id,
      team_id: input.team_id,
      match_id: input.match_id,
      hole_number: input.hole_number,
      strokes: input.strokes,
    })
    .onConflictDoUpdate(conflict)
    .returning();

  return row ? toScoreEntry(row) : null;
};
