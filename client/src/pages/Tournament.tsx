import { Link, useParams } from "react-router-dom";
import { useTournament } from "../api/tournaments";
import { useStickyTab } from "../hooks/useStickyTab";

const Tournament = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tournament, isLoading, error } = useTournament(id);
  const [lastTeamId] = useStickyTab(`teams:${id}`);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        Loading tournament...
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        {error ? error.message : "Tournament not found."}
      </div>
    );
  }

  // teamA/teamB are the left/right columns; points come from standings.
  const [teamA, teamB] = tournament.teams;
  const pointsByTeam = new Map(
    tournament.standings.map((s) => [s.team_id, s.points]),
  );
  const teamPoints = (teamId: string | undefined) =>
    teamId ? (pointsByTeam.get(teamId) ?? 0) : 0;
  const aPts = teamPoints(teamA?.id);
  const bPts = teamPoints(teamB?.id);
  const leaderId = aPts === bPts ? null : aPts > bPts ? teamA?.id : teamB?.id;

  const sessionPoints = (
    session: (typeof tournament.sessions)[number],
    teamId: string | undefined,
  ) => session.standings.find((s) => s.team_id === teamId)?.points ?? 0;

  // Open the roster on the team you were last looking at, falling back to the
  // first team when nothing is remembered (or it belongs to another tournament).
  const rosterTeamId = tournament.teams.some((t) => t.id === lastTeamId)
    ? lastTeamId
    : tournament.teams[0].id;

  // Venues, in round order. A tournament can span more than one course, so
  // list whichever it actually plays rather than assuming a single home club.
  const venues = [
    ...new Set(
      tournament.sessions
        .map((s) => s.course_name)
        .filter((name): name is string => !!name),
    ),
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800 sm:text-4xl">
          {tournament.name}
        </h1>
        {venues.length > 0 ? (
          <p className="text-ink-muted mt-4 text-lg">{venues.join(" · ")}</p>
        ) : null}
      </header>

      {/* Headline standings */}
      <div className="flex flex-col gap-2 -mt-2">
        <h2 className="font-bold text-fairway-700 text-2xl ml-2">Score</h2>
        <div className="grid grid-cols-2 gap-4">
          {tournament.teams.map((team) => (
            <Link
              key={team.name}
              to={`/tournaments/${id}/teams/${team.id}`}
              className={`flex flex-col items-center gap-1 rounded-2xl p-6 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
                team.id === leaderId
                  ? "bg-fairway-600 text-white ring-fairway-700"
                  : "bg-white text-fairway-800 ring-fairway-900/5"
              }`}
            >
              <span className="text-sm font-medium opacity-80">
                {team.name}
              </span>
              <span className="text-5xl font-extrabold tabular-nums">
                {teamPoints(team.id)}
              </span>
              <span className="text-xs opacity-70">View team →</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Points by session */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">
            Points by session
          </h2>
          <Link
            to={`/tournaments/${id}/leaderboard`}
            className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
          >
            Round-by-round →
          </Link>
        </div>
        <ul className="flex flex-col divide-y divide-fairway-100">
          {tournament.sessions.map((session) => (
            <li
              key={session.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5"
            >
              <span
                className={`text-right text-sm font-semibold tabular-nums ${
                  sessionPoints(session, teamA?.id) >
                  sessionPoints(session, teamB?.id)
                    ? "text-fairway-700"
                    : "text-ink-muted"
                }`}
              >
                {sessionPoints(session, teamA?.id)}
              </span>
              <span className="text-center text-sm font-medium text-ink">
                {session.name}
              </span>
              <span
                className={`text-left text-sm font-semibold tabular-nums ${
                  sessionPoints(session, teamB?.id) >
                  sessionPoints(session, teamA?.id)
                    ? "text-fairway-700"
                    : "text-ink-muted"
                }`}
              >
                {sessionPoints(session, teamB?.id)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick nav */}
      {
        <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to={`/tournaments/${id}/leaderboard`}
            className="flex items-center justify-between rounded-xl bg-white p-4 font-semibold text-fairway-800 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Round-by-round leaderboard <span aria-hidden>→</span>
          </Link>
          <Link
            to={`/tournaments/${id}/teams/${rosterTeamId}`}
            className="flex items-center justify-between rounded-xl bg-white p-4 font-semibold text-fairway-800 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Teams &amp; rosters <span aria-hidden>→</span>
          </Link>
        </nav>
      }
    </div>
  );
};

export default Tournament;
