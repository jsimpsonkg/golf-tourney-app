import type { TournamentDetail } from "@golf/shared";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const Tournament = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { id } = useParams<{ id: string }>();
  const [tournament, setTournament] = useState<TournamentDetail>();
  //const [courseName, setCourseName] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/tournaments/${id}`);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const body = await response.json();
      const tournamentDetail = body as TournamentDetail;

      setTournament(tournamentDetail);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load tournament",
      );
    } finally {
      setIsLoading(false);
    }
  }

  /*async function getCourseName() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/tournaments/${id}`);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const body = await response.json();
      const tournamentDetail = body as TournamentDetail;

      setTournament(tournamentDetail);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to load tournament",
      );
    } finally {
      setIsLoading(false);
    }
  }*/

  useEffect(() => {
    loadData();
  }, [id]);

  /* GET POINTS
  const leader: Team | null =
    TEAMS.A.points === TEAMS.B.points
      ? null
      : TEAMS.A.points > TEAMS.B.points
        ? "A"
        : "B";
  */

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
        {error ?? "Tournament not found."}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800 sm:text-4xl">
          {tournament.name}
        </h1>
        <p className="text-ink-muted mt-4 text-lg">
          Muskoka Highlands
          {/*Course Name*/}
        </p>
        <p className="text-ink-muted">
          {/*First to {TOURNAMENT.pointsToWin} points wins*/}
        </p>
      </header>

      {/* Headline standings */}
      <div className="grid grid-cols-2 gap-4">
        {tournament.teams.map((team) => (
          <Link
            key={team.name}
            to={`/tournaments/${id}/teams/${team.id}`}
            className={`flex flex-col items-center gap-1 rounded-2xl p-6 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
              //leader === side -> GET LEADER
              team.id === tournament.teams[0].id
                ? "bg-fairway-600 text-white ring-fairway-700"
                : "bg-white text-fairway-800 ring-fairway-900/5"
            }`}
          >
            <span className="text-sm font-medium opacity-80">{team.name}</span>
            <span className="text-5xl font-extrabold tabular-nums">
              0{/*team.points //GET POINTS */}
            </span>
            <span className="text-xs opacity-70">View team →</span>
          </Link>
        ))}
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
                  /*session.points.A > session.points.B // GET POINTS */
                  session.id === tournament.sessions[0].id
                    ? "text-fairway-700"
                    : "text-ink-muted"
                }`}
              >
                0{/*session.points.A*/}
              </span>
              <span className="text-center text-sm font-medium text-ink">
                {session.name}
              </span>
              <span
                className={`text-left text-sm font-semibold tabular-nums ${
                  /*session.points.B > session.points.A*/
                  session.id === tournament.sessions[0].id
                    ? "text-fairway-700"
                    : "text-ink-muted"
                }`}
              >
                0{/*session.points.B*/}
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
            to={`/tournaments/${id}/teams/${tournament.teams[0].id}`}
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
