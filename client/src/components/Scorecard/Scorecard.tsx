import type { ScorecardProps } from "./Scorecard.types";
import { sumAt } from "../../utils/scorecardUtils";
import PlayerNames from "../PlayerNames";

const Scorecard = ({ label, totalLabel, holes, card }: ScorecardProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-fairway-900/5">
      <table className="w-full border-collapse text-center text-xs sm:text-sm">
        <thead>
          <tr className="text-ink-muted">
            <th className="px-1 py-2 text-left font-semibold text-fairway-800 sm:px-3">
              {label}
            </th>
            {holes.map((i) => (
              <th key={i} className="w-7 px-0 py-2 font-medium sm:w-auto sm:px-1">
                {i + 1}
              </th>
            ))}
            <th className="w-8 px-0 py-2 font-semibold text-fairway-800 sm:px-2">
              {totalLabel}
            </th>
          </tr>
          <tr className="text-ink-muted">
            <td className="px-1 py-1 text-left font-medium sm:px-3">Par</td>
            {holes.map((i) => (
              <td key={i} className="px-0 py-1 sm:px-1">
                {card.pars[i]}
              </td>
            ))}
            <td className="px-0 py-1 font-semibold text-fairway-800 sm:px-2">
              {sumAt(card.pars, holes)}
            </td>
          </tr>
        </thead>
        <tbody>
          {card.sides.map((side) => (
            <tr key={side.team_id} className="border-t border-fairway-100">
              <td className="px-1 py-2 text-left align-middle font-semibold leading-tight text-fairway-800 sm:px-3">
                <PlayerNames names={side.players} className="block" />
              </td>
              {holes.map((i) => {
                const s = side.strokes[i];
                const par = card.pars[i];
                return (
                  <td key={i} className="px-0 py-2 sm:px-1">
                    {s == null ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center text-ink-muted sm:h-7 sm:w-7">
                        –
                      </span>
                    ) : (
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center tabular-nums leading-none sm:h-7 sm:w-7 ${
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
              <td className="px-0 py-2 font-bold text-fairway-800 sm:px-2">
                {sumAt(side.strokes, holes)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Scorecard;
