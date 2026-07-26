import type { ScorecardProps } from "./Scorecard.types";
import { sumAt } from "../../utils/scorecardUtils";

const Scorecard = ({ label, totalLabel, holes, card }: ScorecardProps) => {
  return (
    <div className="overflow-hidden rounded-xl bg-white p-2 shadow-sm ring-1 ring-fairway-900/5">
      <table className="w-full border-collapse text-center text-sm">
        <thead>
          <tr className="text-ink-muted">
            <th className="px-3 py-2 text-left font-semibold text-fairway-800">
              {label}
            </th>
            {holes.map((i) => (
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
            {holes.map((i) => (
              <td key={i} className="px-1 py-1">
                {card.pars[i]}
              </td>
            ))}
            <td className="px-2 py-1 font-semibold text-fairway-800">
              {sumAt(card.pars, holes)}
            </td>
          </tr>
        </thead>
        <tbody>
          {card.sides.map((side) => (
            <tr key={side.team_id} className="border-t border-fairway-100">
              <td className="px-3 py-2 text-left font-semibold leading-tight text-fairway-800">
                {side.players.map((part, idx, arr) => (
                  <div key={idx}>
                    {part}
                    {idx < arr.length - 1 ? " /" : ""}
                  </div>
                ))}
              </td>
              {holes.map((i) => {
                const s = side.strokes[i];
                const par = card.pars[i];
                return (
                  <td key={i} className="px-1 py-2">
                    {s == null ? (
                      <span className="inline-flex h-7 w-7 items-center justify-center text-ink-muted">
                        –
                      </span>
                    ) : (
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center tabular-nums leading-none ${
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
