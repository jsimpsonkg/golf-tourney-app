import { useState } from "react";
import { Link, useParams } from "react-router-dom";

// TODO: hardcoded fixtures — swap for the match's CourseHoles + participants.
const PARS = [4, 5, 4, 3, 4, 4, 5, 3, 4, 4, 4, 3, 5, 4, 4, 3, 4, 5];

const PLAYERS = [
  { id: "p1", name: "Scheffler" },
  { id: "p2", name: "Cantlay" },
  { id: "p3", name: "McIlroy" },
  { id: "p4", name: "Fleetwood" },
];

const EnterScores = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [holeIndex, setHoleIndex] = useState(0);
  // strokes[playerId][holeIndex] — undefined until entered.
  const [strokes, setStrokes] = useState<Record<string, (number | undefined)[]>>(
    () => Object.fromEntries(PLAYERS.map((p) => [p.id, Array(18).fill(undefined)])),
  );

  const par = PARS[holeIndex];

  const setStroke = (playerId: string, value: number) => {
    setStrokes((prev) => {
      const next = { ...prev, [playerId]: [...prev[playerId]] };
      next[playerId][holeIndex] = Math.max(1, value);
      return next;
    });
  };

  const handleSave = () => {
    const entries = PLAYERS.map((p) => ({
      player_id: p.id,
      hole_number: holeIndex + 1,
      strokes: strokes[p.id][holeIndex],
    }));
    // TODO: POST to /api/matches/:id/scores
    console.log("save hole", entries);
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Link
        to={`/matches/${matchId}`}
        className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
      >
        ← Scorecard
      </Link>
      <header className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-fairway-800">
          Enter Scores
        </h1>
        <p className="text-ink-muted">Foursomes · Match 1</p>
      </header>

      <div className="flex items-center justify-between rounded-xl bg-fairway-600 px-4 py-3 text-white shadow-sm">
        <button
          type="button"
          onClick={() => setHoleIndex((i) => Math.max(0, i - 1))}
          disabled={holeIndex === 0}
          className="rounded-full px-3 py-1 text-xl font-bold disabled:opacity-30"
          aria-label="Previous hole"
        >
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm opacity-80">Hole {holeIndex + 1}</div>
          <div className="text-lg font-bold">Par {par}</div>
        </div>
        <button
          type="button"
          onClick={() => setHoleIndex((i) => Math.min(17, i + 1))}
          disabled={holeIndex === 17}
          className="rounded-full px-3 py-1 text-xl font-bold disabled:opacity-30"
          aria-label="Next hole"
        >
          ›
        </button>
      </div>

      <ul className="flex flex-col gap-3">
        {PLAYERS.map((player) => {
          const value = strokes[player.id][holeIndex];
          return (
            <li
              key={player.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5"
            >
              <span className="text-sm font-semibold text-fairway-800">
                {player.name}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStroke(player.id, (value ?? par) - 1)}
                  className="h-9 w-9 rounded-full bg-fairway-100 text-lg font-bold text-fairway-700 hover:bg-fairway-200"
                  aria-label={`Decrease ${player.name}'s score`}
                >
                  −
                </button>
                <span className="w-8 text-center text-xl font-bold tabular-nums text-ink">
                  {value ?? "–"}
                </span>
                <button
                  type="button"
                  onClick={() => setStroke(player.id, (value ?? par - 1) + 1)}
                  className="h-9 w-9 rounded-full bg-fairway-100 text-lg font-bold text-fairway-700 hover:bg-fairway-200"
                  aria-label={`Increase ${player.name}'s score`}
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={handleSave}
        className="rounded-xl bg-fairway-600 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-fairway-700"
      >
        Save hole {holeIndex + 1}
      </button>
    </div>
  );
};

export default EnterScores;
