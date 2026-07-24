import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Tabs } from "../components/Tabs";

// ---------------------------------------------------------------------------
// HARDCODED FIXTURE — remove once the scores endpoint is read back per match.
// No read route for hole-by-hole scores exists yet, so this renders a static
// scorecard. Replace `PARS` / `ROUNDS` with `CourseHole[]` + `ScoreEntry[]`
// fetched for the match, grouped by hole_number.
// ---------------------------------------------------------------------------

const PARS = [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];

interface ScorecardPlayer {
  name: string;
  strokes: (number | null)[];
}

interface RoundCard {
  id: string;
  name: string;
  matchLabel: string;
  players: ScorecardPlayer[];
}

const ROUNDS: RoundCard[] = [
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

const total = (strokes: (number | null)[]) =>
  strokes.reduce<number>((sum, s) => sum + (s ?? 0), 0);

const relToPar = (strokes: (number | null)[]) => {
  const diff = strokes.reduce<number>(
    (acc, s, i) => (s === null ? acc : acc + s - PARS[i]),
    0,
  );
  if (diff === 0) return "E";
  return diff > 0 ? `+${diff}` : `${diff}`;
};

const ViewScores = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [activeRoundId, setActiveRoundId] = useState(ROUNDS[0].id);
  const round = ROUNDS.find((r) => r.id === activeRoundId) ?? ROUNDS[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
        >
          ← Back
        </button>
        <Link
          to={`/matches/${matchId}/enter`}
          className="rounded-lg bg-fairway-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-fairway-700"
        >
          Enter scores
        </Link>
      </div>

      <header className="flex flex-col items-center gap-4 text-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800">
            Scorecard
          </h1>
          <p className="text-ink-muted">{round.name} · {round.matchLabel}</p>
        </div>
        <Tabs
          ariaLabel="Rounds"
          tabs={ROUNDS.map((r) => ({ label: r.name, value: r.id }))}
          value={activeRoundId}
          onChange={setActiveRoundId}
        />
      </header>

      <div className="overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-fairway-900/5">
        <table className="w-full border-collapse text-center text-sm">
          <thead>
            <tr className="text-ink-muted">
              <th className="sticky left-0 bg-white px-3 py-2 text-left font-medium">
                Hole
              </th>
              {PARS.map((_, i) => (
                <th key={i} className="px-2 py-2 font-medium">{i + 1}</th>
              ))}
              <th className="px-3 py-2 font-semibold text-fairway-800">Tot</th>
            </tr>
            <tr className="text-ink-muted">
              <td className="sticky left-0 bg-white px-3 py-1 text-left font-medium">
                Par
              </td>
              {PARS.map((par, i) => (
                <td key={i} className="px-2 py-1">{par}</td>
              ))}
              <td className="px-3 py-1 font-semibold text-fairway-800">
                {total(PARS)}
              </td>
            </tr>
          </thead>
          <tbody>
            {round.players.map((player) => (
              <tr key={player.name} className="border-t border-fairway-100">
                <td className="sticky left-0 bg-white px-3 py-2 text-left font-semibold whitespace-nowrap text-fairway-800">
                  {player.name}
                </td>
                {player.strokes.map((s, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2 ${
                      s !== null && s < PARS[i]
                        ? "font-bold text-fairway-600"
                        : "text-ink"
                    }`}
                  >
                    {s ?? "–"}
                  </td>
                ))}
                <td className="px-3 py-2 font-bold text-fairway-800">
                  {total(player.strokes)}{" "}
                  <span className="text-xs font-medium text-ink-muted">
                    ({relToPar(player.strokes)})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewScores;
