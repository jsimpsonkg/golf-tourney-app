import type { MatchScorecard, ScorecardSide } from "@golf/shared";
import type { ScorecardProps } from "./Scorecard.types";
import { sumAt } from "../../data/scorecard";

const Scorecard = ({ label, totalLabel, card }: ScorecardProps) => {
  const cardByTeam: ScorecardSide[] = card.sides;

  return (
    <div className="overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-fairway-900/5">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr className="text-ink-muted">
            <th className="px-3 py-2 text-left font-semibold text-fairway-800">
              {label}
            </th>
            {card.pars.map((i) => (
              <th key={i} className="px-1 py-2 font-medium">
                {i + 1}
              </th>
            ))}
            <th className="px-2 py-2 font-semibold text-fairway-800">
              {totalLabel}
            </th>
          </tr>
          <tr className="text-ink-muted">
            <td className="px-3 py-1 text-left font-medium">Par</td>
            {card.pars.map((i) => (
              <td key={i} className="px-1 py-1">
                {card.pars[i]}
              </td>
            ))}
            <td className="px-2 py-1 font-semibold text-fairway-800">
              {sumAt(card.pars, card.pars)}
            </td>
          </tr>
        </thead>
        <tbody>
          {
            //round.players.map((player) => (
            cardByTeam[0].players.map((player) => (
              <tr key={player} className="border-t border-fairway-100">
                <td className="px-3 py-2 text-left font-semibold leading-tight text-fairway-800">
                  {player.split(" / ").map((part, idx, arr) => (
                    <div key={idx}>
                      {part}
                      {idx < arr.length - 1 ? " /" : ""}
                    </div>
                  ))}
                </td>
                {card.pars.map((i) => {
                  const s = cardByTeam[0].strokes[i];
                  const par = card.pars[i];
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
                  {sumAt(cardByTeam[0].strokes, card.pars)}
                </td>
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
};

export default Scorecard;
