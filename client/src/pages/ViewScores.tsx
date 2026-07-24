import { Link, useParams } from "react-router-dom";
import { BACK, FRONT, PARS, getRound, matchStatus, sumAt } from "../data/scorecard";

const ViewScores = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const round = getRound(matchId);
  const status = matchStatus(round.players);

  const renderNine = (label: string, holes: number[], totalLabel: string) => (
    <div className="overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-fairway-900/5">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr className="text-ink-muted">
            <th className="px-3 py-2 text-left font-semibold text-fairway-800">
              {label}
            </th>
            {holes.map((i) => (
              <th key={i} className="px-1 py-2 font-medium">{i + 1}</th>
            ))}
            <th className="px-2 py-2 font-semibold text-fairway-800">{totalLabel}</th>
          </tr>
          <tr className="text-ink-muted">
            <td className="px-3 py-1 text-left font-medium">Par</td>
            {holes.map((i) => (
              <td key={i} className="px-1 py-1">{PARS[i]}</td>
            ))}
            <td className="px-2 py-1 font-semibold text-fairway-800">
              {sumAt(PARS, holes)}
            </td>
          </tr>
        </thead>
        <tbody>
          {round.players.map((player) => (
            <tr key={player.name} className="border-t border-fairway-100">
              <td className="px-3 py-2 text-left font-semibold leading-tight text-fairway-800">
                {player.name.split(" / ").map((part, idx, arr) => (
                  <div key={idx}>
                    {part}
                    {idx < arr.length - 1 ? " /" : ""}
                  </div>
                ))}
              </td>
              {holes.map((i) => {
                const s = player.strokes[i];
                const par = PARS[i];
                return (
                  <td key={i} className="px-1 py-2">
                    {s === null ? (
                      <span className="text-ink-muted">–</span>
                    ) : (
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center ${
                          s < par
                            ? "rounded-full border-2 border-fairway-500 font-bold text-fairway-700"
                            : s > par
                              ? "border-2 border-rose-400 font-semibold text-rose-600"
                              : "text-ink"
                        }`}
                      >
                        {s}
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 font-bold text-fairway-800">
                {sumAt(player.strokes, holes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/tournaments/${matchId}/leaderboard`}
          className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
        >
          ← Leaderboard
        </Link>
        <Link
          to={`/matches/${matchId}/enter`}
          className="rounded-lg bg-fairway-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-fairway-700"
        >
          Enter scores
        </Link>
      </div>

      <header className="flex flex-col items-center gap-3 text-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800">
            Scorecard
          </h1>
          <p className="text-ink-muted">{round.name} · {round.matchLabel}</p>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm">
          {round.players.map((player, idx) => (
            <div key={player.name} className="flex items-center gap-3">
              {idx > 0 && <span className="text-ink-muted">vs</span>}
              <Link
                to={`/matches/${matchId}/teams/${idx}`}
                className="rounded-full bg-fairway-50 px-3 py-1 font-semibold text-fairway-700 ring-1 ring-fairway-200 transition-colors hover:bg-fairway-100"
              >
                {player.name}
              </Link>
            </div>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-4">
        {renderNine("Front 9", FRONT, "Out")}
        {renderNine("Back 9", BACK, "In")}

        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-fairway-900/5">
          <span className="text-sm font-medium text-ink-muted">Status</span>
          <span className="text-sm font-bold text-fairway-700">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default ViewScores;
