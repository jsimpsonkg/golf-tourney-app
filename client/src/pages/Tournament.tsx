import { Link, useParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// HARDCODED FIXTURE — remove once tournament + leaderboard data is fetched.
// This hub is the tournament landing page: overall standings plus navigation
// into rounds and teams. Replace `TOURNAMENT` / `TEAMS` / `SESSION_BREAKDOWN`
// with a `TournamentDetail` + `LeaderboardView` fetch keyed on `id`.
// ---------------------------------------------------------------------------

type Side = "A" | "B";

const TOURNAMENT = { name: "Ryder Cup 2026", pointsToWin: 14.5 };

const TEAMS: Record<Side, { id: string; name: string; points: number }> = {
  A: { id: "team-usa", name: "USA", points: 4.5 },
  B: { id: "team-europe", name: "Europe", points: 3.5 },
};

interface SessionBreakdown {
  id: string;
  name: string;
  points: Record<Side, number>;
}

const SESSION_BREAKDOWN: SessionBreakdown[] = [
  { id: "s1", name: "Foursomes", points: { A: 2.5, B: 1.5 } },
  { id: "s2", name: "Fourball", points: { A: 2, B: 2 } },
  { id: "s3", name: "Singles", points: { A: 0, B: 0 } },
];

const Tournament = () => {
  const { id } = useParams<{ id: string }>();

  const leader: Side | null =
    TEAMS.A.points === TEAMS.B.points
      ? null
      : TEAMS.A.points > TEAMS.B.points
      ? "A"
      : "B";

  return (
    <div className="flex flex-col gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800 sm:text-4xl">
          {TOURNAMENT.name}
        </h1>
        <p className="text-ink-muted">First to {TOURNAMENT.pointsToWin} points wins</p>
      </header>

      {/* Headline standings */}
      <div className="grid grid-cols-2 gap-4">
        {(["A", "B"] as Side[]).map((side) => (
          <Link
            key={side}
            to={`/tournaments/${id}/teams/${TEAMS[side].id}`}
            className={`flex flex-col items-center gap-1 rounded-2xl p-6 shadow-sm ring-1 transition hover:-translate-y-0.5 hover:shadow-md ${
              leader === side
                ? "bg-fairway-600 text-white ring-fairway-700"
                : "bg-white text-fairway-800 ring-fairway-900/5"
            }`}
          >
            <span className="text-sm font-medium opacity-80">{TEAMS[side].name}</span>
            <span className="text-5xl font-extrabold tabular-nums">
              {TEAMS[side].points}
            </span>
            <span className="text-xs opacity-70">View team →</span>
          </Link>
        ))}
      </div>

      {/* Points by session */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">Points by session</h2>
          <Link
            to={`/tournaments/${id}/leaderboard`}
            className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
          >
            Round-by-round →
          </Link>
        </div>
        <ul className="flex flex-col divide-y divide-fairway-100">
          {SESSION_BREAKDOWN.map((session) => (
            <li
              key={session.id}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5"
            >
              <span
                className={`text-right text-sm font-semibold tabular-nums ${
                  session.points.A > session.points.B
                    ? "text-fairway-700"
                    : "text-ink-muted"
                }`}
              >
                {session.points.A}
              </span>
              <span className="text-center text-sm font-medium text-ink">
                {session.name}
              </span>
              <span
                className={`text-left text-sm font-semibold tabular-nums ${
                  session.points.B > session.points.A
                    ? "text-fairway-700"
                    : "text-ink-muted"
                }`}
              >
                {session.points.B}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick nav */}
      <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          to={`/tournaments/${id}/leaderboard`}
          className="flex items-center justify-between rounded-xl bg-white p-4 font-semibold text-fairway-800 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          Round-by-round leaderboard <span aria-hidden>→</span>
        </Link>
        <Link
          to={`/tournaments/${id}/teams/${TEAMS.A.id}`}
          className="flex items-center justify-between rounded-xl bg-white p-4 font-semibold text-fairway-800 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          Teams &amp; rosters <span aria-hidden>→</span>
        </Link>
      </nav>
    </div>
  );
};

export default Tournament;
