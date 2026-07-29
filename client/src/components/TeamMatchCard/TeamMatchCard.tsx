import { Link } from "react-router-dom";
import type { TeamMatchCardProps } from "./TeamMatchCard.types";

const resultStyles: Record<TeamMatchCardProps["result"], string> = {
  win: "bg-fairway-100 text-fairway-700",
  loss: "bg-red-100 text-red-700",
  halved: "bg-black/5 text-ink-muted",
  live: "bg-sand-200 text-sand-500",
  upcoming: "bg-black/5 text-ink-muted",
};

const resultLabels: Record<TeamMatchCardProps["result"], string> = {
  win: "Won",
  loss: "Lost",
  halved: "Halved",
  live: "Live",
  upcoming: "Upcoming",
};

const TeamMatchCard = ({
  id,
  session,
  opponent,
  result,
  statusLabel,
}: TeamMatchCardProps) => {
  return (
    <Link
      key={id}
      to={`/matches/${id}`}
      className="flex items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex flex-col">
        <span className="text-xs font-medium text-ink-muted">{session}</span>
        <span className="text-sm font-semibold text-fairway-800">
          vs {opponent}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-muted">
          {statusLabel}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${resultStyles[result]}`}
        >
          {resultLabels[result]}
        </span>
      </div>
    </Link>
  );
};

export default TeamMatchCard;
