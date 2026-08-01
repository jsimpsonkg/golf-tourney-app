import { eq, inArray, sql, and, or } from "drizzle-orm";
import { db } from "../db/index";
import {
  tournaments,
  teams,
  players,
  sessions,
  matches,
  match_participants,
  courses,
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

// Drizzle hands back Dates and numeric-as-string; these map rows to the
// JSON-friendly shared shapes so callers never deal with raw rows.

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

// course_name rides along from a left join so callers can label a round with
// its venue without a second query.
const toSession = (
  r: Row<typeof sessions>,
  courseName: string | null = null,
): Session => ({
  id: r.id,
  tournament_id: r.tournament_id,
  name: r.name,
  session_type: r.session_type,
  course_id: r.course_id,
  course_name: courseName,
  point_value: Number(r.point_value),
  sort_order: r.sort_order ?? 0,
});

const toMatch = (r: Row<typeof matches>): Match => ({
  id: r.id,
  session_id: r.session_id,
  match_number: r.match_number,
  match_type: r.match_type,
  point_value: r.point_value === null ? null : Number(r.point_value),
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

// --- Queries ---

export const listTournaments = async (): Promise<Tournament[]> =>
  (await db.select().from(tournaments)).map(toTournament);

export const getTournament = async (id: string): Promise<Tournament | null> => {
  const [row] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, id));
  return row ? toTournament(row) : null;
};

export const getMatch = async (id: string): Promise<Match | null> => {
  const [row] = await db.select().from(matches).where(eq(matches.id, id));
  return row ? toMatch(row) : null;
};

export const getSession = async (id: string): Promise<Session | null> => {
  const [row] = await db
    .select({ session: sessions, course_name: courses.name })
    .from(sessions)
    .leftJoin(courses, eq(courses.id, sessions.course_id))
    .where(eq(sessions.id, id));
  return row ? toSession(row.session, row.course_name) : null;
};

export const getTeamsByTournament = async (
  tournamentId: string,
): Promise<Team[]> =>
  (
    await db.select().from(teams).where(eq(teams.tournament_id, tournamentId))
  ).map(toTeam);

export const getTeamById = async (teamId: string): Promise<Team[]> =>
  (await db.select().from(teams).where(eq(teams.id, teamId))).map(toTeam);

export const getPlayersByTournament = async (
  tournamentId: string,
): Promise<Player[]> =>
  (
    await db
      .select()
      .from(players)
      .where(eq(players.tournament_id, tournamentId))
  ).map(toPlayer);

export const getPlayersByTeam = async (
  tournamentId: string,
  teamId: string,
): Promise<Player[]> =>
  (
    await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.tournament_id, tournamentId),
          eq(players.team_id, teamId),
        ),
      )
  ).map(toPlayer);

export const getSessionsByTournament = async (
  tournamentId: string,
): Promise<Session[]> =>
  (
    await db
      .select({ session: sessions, course_name: courses.name })
      .from(sessions)
      .leftJoin(courses, eq(courses.id, sessions.course_id))
      .where(eq(sessions.tournament_id, tournamentId))
      .orderBy(sessions.sort_order)
  ).map((r) => toSession(r.session, r.course_name));

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

export const getParticipantsByMatch = (
  matchId: string,
): Promise<MatchParticipant[]> => getParticipantsByMatches([matchId]);

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

export const getScoreEntriesByMatches = async (
  matchIds: string[],
): Promise<ScoreEntry[]> =>
  matchIds.length
    ? (
        await db
          .select()
          .from(score_entries)
          .where(inArray(score_entries.match_id, matchIds))
          .orderBy(score_entries.hole_number)
      ).map(toScoreEntry)
    : [];

// Every hole belonging to a tournament, across all its courses. Callers that
// need one round's layout should group these by course_id (see
// ../services/courses) rather than assuming a single 18.
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

export const getHolesByCourse = async (
  courseId: string,
): Promise<CourseHole[]> =>
  (
    await db
      .select()
      .from(course_holes)
      .where(eq(course_holes.course_id, courseId))
      .orderBy(course_holes.hole_number)
  ).map(toCourseHole);

// --- Writes ---

export interface ScoreUpsert {
  player_id: string | null; // exactly one of player_id / team_id (DB XOR check)
  team_id: string | null;
  match_id: string;
  hole_number: number;
  strokes: number;
}

export type ScoreKey = Omit<ScoreUpsert, "strokes">;

export const upsertScores = async (
  inputs: ScoreUpsert[],
): Promise<ScoreEntry[]> => {
  const byPlayer = inputs.filter((i) => i.player_id !== null);
  const byTeam = inputs.filter((i) => i.player_id === null);

  const run = async (rows: ScoreUpsert[], keyed: "player" | "team") => {
    if (rows.length === 0) return [];
    const column = keyed === "player" ? score_entries.player_id : score_entries.team_id;
    const inserted = await db
      .insert(score_entries)
      .values(
        rows.map((r) => ({
          player_id: r.player_id,
          team_id: r.team_id,
          match_id: r.match_id,
          hole_number: r.hole_number,
          strokes: r.strokes,
        })),
      )
      .onConflictDoUpdate({
        target: [column, score_entries.match_id, score_entries.hole_number],
        targetWhere: sql`${column} IS NOT NULL`,
        set: { strokes: sql`excluded.strokes` },
      })
      .returning();
    return inserted.map(toScoreEntry);
  };

  return [...(await run(byPlayer, "player")), ...(await run(byTeam, "team"))];
};

// A score belongs to either a player (singles/four-ball) or a team
// (scramble/foursomes), never both. Upserts on the matching partial unique
// index so re-entering a hole overwrites cleanly.
export const upsertScore = async (
  input: ScoreUpsert,
): Promise<ScoreEntry | null> => {
  const [row] = await upsertScores([input]);
  return row ?? null;
};

export const deleteScores = async (keys: ScoreKey[]): Promise<number> => {
  if (keys.length === 0) return 0;

  const rows = await db
    .delete(score_entries)
    .where(
      or(
        ...keys.map((k) =>
          and(
            eq(score_entries.match_id, k.match_id),
            eq(score_entries.hole_number, k.hole_number),
            k.player_id !== null
              ? eq(score_entries.player_id, k.player_id)
              : eq(score_entries.team_id, k.team_id as string),
          ),
        ),
      ),
    )
    .returning({ id: score_entries.id });

  return rows.length;
};
