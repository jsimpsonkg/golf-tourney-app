import { Link } from "react-router-dom";
import type { LeaderboardMatchRow } from "./MatchCard.types";
import type { MatchState } from "@golf/shared";
import PlayerNames from "../PlayerNames";

const stateStyles: Record<MatchState, string> = {
  completed: "bg-fairway-100 text-fairway-700",
  in_progress: "bg-sand-200 text-sand-500",
  not_started: "bg-black/5 text-ink-muted",
};

const stateLabels: Record<MatchState, string> = {
  completed: "Final",
  in_progress: "Live",
  not_started: "Upcoming",
};

const MatchCard = ({
  matchId,
  matchNumber,
  players,
  state,
  statusLines,
  leader,
}: LeaderboardMatchRow) => {
  return (
    <Link
      to={`/matches/${matchId}`}
      className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-muted">
          Match {matchNumber ?? "—"}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stateStyles[state]}`}
        >
          {stateLabels[state]}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* max-w keeps the pairing stacked next to the status pill instead of
            stretching a single line across the full card width. */}
        <PlayerNames
          names={players.A}
          className={`ml-auto block max-w-[9rem] text-right text-sm ${
            leader === "A" ? "font-bold text-fairway-800" : "text-ink-muted"
          }`}
        />
        {/* One row per nine. The label column is fixed so "F9"/"B9" stay in a
            straight line and the results align under each other. */}
        <span className="flex flex-col gap-0.5 rounded-md bg-fairway-50 px-2.5 py-1 text-sm font-semibold text-fairway-700">
          {statusLines.map((line, i) => (
            <span
              key={i}
              className="flex items-baseline justify-center gap-1.5 whitespace-nowrap"
            >
              {line.label ? (
                <span className="w-5 text-left text-xs font-bold text-fairway-500">
                  {line.label}
                </span>
              ) : null}
              <span className={line.label ? "flex-1 text-left" : ""}>
                {line.value}
              </span>
            </span>
          ))}
        </span>
        <PlayerNames
          names={players.B}
          className={`mr-auto block max-w-[9rem] text-left text-sm ${
            leader === "B" ? "font-bold text-fairway-800" : "text-ink-muted"
          }`}
        />
      </div>
    </Link>
  );
};

export default MatchCard;
