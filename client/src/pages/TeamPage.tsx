import { Link, useParams } from "react-router-dom";

// ---------------------------------------------------------------------------
// HARDCODED FIXTURE — remove once team data is fetched.
// Replace `TEAM` with a `Team` + its `Player[]` (filtered from
// TournamentDetail), and `RESULTS` with this team's `MatchResult`s.
// ---------------------------------------------------------------------------

interface TeamMatch {
  id: string;
  session: string;
  opponent: string;
  result: "win" | "loss" | "halved" | "live";
  statusLabel: string;
}

const TEAM = {
  name: "USA",
  points: 4.5,
  players: [
    "Scottie Scheffler",
    "Patrick Cantlay",
    "Xander Schauffele",
    "Justin Thomas",
    "Jordan Spieth",
    "Max Homa",
  ],
};

const RESULTS: TeamMatch[] = [
  { id: "m1", session: "Foursomes", opponent: "McIlroy / Fleetwood", result: "win", statusLabel: "3&2" },
  { id: "m2", session: "Foursomes", opponent: "Rahm / Hovland", result: "loss", statusLabel: "1 dn" },
  { id: "m3", session: "Foursomes", opponent: "Lowry / Straka", result: "halved", statusLabel: "AS" },
  { id: "m4", session: "Fourball", opponent: "McIlroy / Rahm", result: "live", statusLabel: "2 up thru 14" },
];

const resultStyles: Record<TeamMatch["result"], string> = {
  win: "bg-fairway-100 text-fairway-700",
  loss: "bg-red-100 text-red-700",
  halved: "bg-black/5 text-ink-muted",
  live: "bg-sand-200 text-sand-500",
};

const resultLabels: Record<TeamMatch["result"], string> = {
  win: "Won",
  loss: "Lost",
  halved: "Halved",
  live: "Live",
};

const TeamPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/tournaments/${id}`}
        className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
      >
        ← Standings
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fairway-600 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight">{TEAM.name}</h1>
        <div className="text-right">
          <div className="text-4xl font-extrabold tabular-nums">{TEAM.points}</div>
          <div className="text-sm opacity-80">points</div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Roster</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEAM.players.map((player) => (
            <li
              key={player}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-fairway-800 shadow-sm ring-1 ring-fairway-900/5"
            >
              {player}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Matches</h2>
        <ul className="flex flex-col gap-3">
          {RESULTS.map((match) => (
            <Link
              key={match.id}
              to={`/matches/${match.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col">
                <span className="text-xs font-medium text-ink-muted">
                  {match.session}
                </span>
                <span className="text-sm font-semibold text-fairway-800">
                  vs {match.opponent}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-ink-muted">
                  {match.statusLabel}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${resultStyles[match.result]}`}
                >
                  {resultLabels[match.result]}
                </span>
              </div>
            </Link>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default TeamPage;
