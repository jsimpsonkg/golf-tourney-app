import type { ScorecardSide } from "@golf/shared";
import { Link, useNavigate, useParams } from "react-router-dom";
import { sumAt, relToPar } from "../utils/scorecardUtils";
import { useMatchScorecard } from "../api/matches";

const TeamScores = () => {
  const { matchId, teamIndex } = useParams<{
    matchId: string;
    teamIndex: string;
  }>();
  const navigate = useNavigate();
  const idx = Number(teamIndex) === 1 ? 1 : 0;

  const { data: card, isLoading, error } = useMatchScorecard(matchId);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        Loading scorecard...
      </div>
    );
  }

  const side: ScorecardSide | undefined = card?.sides[idx];
  if (error || !card || !side) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        {error
          ? error.message
          : "Scorecard not found. Try going back to the home page."}
      </div>
    );
  }

  const { pars } = card;
  const FRONT = pars.map((_, i) => i).slice(0, 9);
  const BACK = pars.map((_, i) => i).slice(9);
  const matchLabel =
    card.match_number != null ? `Match ${card.match_number}` : "";

  const scoreCell = (i: number) => {
    const s = side.strokes[i];
    const par = pars[i];
    if (s == null) return <span className="text-ink-muted">–</span>;
    return (
      <span
        className={`inline-flex h-8 w-8 items-center justify-center ${
          s < par
            ? "rounded-full border-2 border-fairway-500 font-bold text-fairway-700"
            : s > par
              ? "border-2 border-rose-400 font-semibold text-rose-600"
              : "text-ink"
        }`}
      >
        {s}
      </span>
    );
  };

  const holeRow = (i: number) => (
    <div
      key={i}
      className="grid grid-cols-3 items-center border-t border-fairway-100 px-4 py-2.5"
    >
      <span className="text-left font-medium text-ink">Hole {i + 1}</span>
      <span className="text-center text-ink-muted">{pars[i]}</span>
      <span className="flex justify-end">{scoreCell(i)}</span>
    </div>
  );

  const subtotalRow = (label: string, holes: number[], strong = false) => (
    <div
      className={`grid grid-cols-3 items-center border-t px-4 py-2.5 ${
        strong
          ? "border-fairway-200 bg-fairway-50 font-bold text-fairway-800"
          : "border-fairway-100 bg-fairway-50/60 font-semibold text-fairway-700"
      }`}
    >
      <span className="text-left uppercase tracking-wide">{label}</span>
      <span className="text-center">{sumAt(pars, holes)}</span>
      <span className="text-right tabular-nums">
        {sumAt(side.strokes, holes)}
      </span>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="self-start text-sm font-semibold text-fairway-600 hover:text-fairway-700 cursor-pointer"
      >
        ← Scorecard
      </button>

      <header className="text-center">
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-fairway-800">
          {side.players.map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 ? " / " : ""}
            </span>
          ))}
        </h1>
        <p className="text-ink-muted">
          {card.session_name}
          {matchLabel && ` · ${matchLabel}`} ·{" "}
          <span className="font-semibold text-fairway-700">
            {relToPar(side.strokes, pars)}
          </span>
        </p>
      </header>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-fairway-900/5">
        <div className="grid grid-cols-3 items-center bg-fairway-600 px-4 py-3 text-sm font-semibold text-white">
          <span className="text-left">Hole</span>
          <span className="text-center">Par</span>
          <span className="text-right">Score</span>
        </div>

        {FRONT.map(holeRow)}
        {subtotalRow("Out", FRONT)}
        {BACK.map(holeRow)}
        {subtotalRow("In", BACK)}
        {subtotalRow("Total", [...FRONT, ...BACK], true)}
      </div>

      <Link
        to={`/matches/${matchId}`}
        className="text-center text-sm font-semibold text-fairway-600 hover:text-fairway-700"
      >
        View full scorecard →
      </Link>
    </div>
  );
};

export default TeamScores;
