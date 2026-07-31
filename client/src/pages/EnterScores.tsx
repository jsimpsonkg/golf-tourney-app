import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ScoreEntryInput } from "@golf/shared";
import { useMatchScorecard, useSaveMatchScores } from "../api/matches";
import { useStickyTab } from "../hooks/useStickyTab";
import { relToPar, sumAt } from "../utils/scorecardUtils";

type Edits = Record<string, Record<number, number | null>>;

const EnterScores = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: card, isLoading, error } = useMatchScorecard(matchId);
  const save = useSaveMatchScores(matchId);

  const [activeTeamId, setActiveTeamId] = useStickyTab(`enterTeam:${matchId}`);
  const [edits, setEdits] = useState<Edits>({});

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        Loading scorecard...
      </div>
    );
  }

  const side =
    card?.sides.find((s) => s.team_id === activeTeamId) ?? card?.sides[0];
  if (error || !card || !side) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        {error
          ? error.message
          : "Scorecard not found. Try going back to the home page."}
      </div>
    );
  }

  const { pars, hole_numbers } = card;
  const teamEdits = edits[side.team_id] ?? {};

  const strokes = pars.map((_, i) =>
    i in teamEdits ? teamEdits[i] : side.strokes[i],
  );

  const setScore = (i: number, value: number | null) => {
    setEdits((prev) => ({
      ...prev,
      [side.team_id]: { ...(prev[side.team_id] ?? {}), [i]: value },
    }));
  };

  const bump = (i: number, delta: number) => {
    const current = strokes[i];
    setScore(
      i,
      current == null ? pars[i] : Math.min(20, Math.max(1, current + delta)),
    );
  };

  const pending: ScoreEntryInput[] = card.sides.flatMap((s) =>
    Object.entries(edits[s.team_id] ?? {})
      .filter(([i, v]) => v !== s.strokes[Number(i)])
      .map(([i, v]) => ({
        team_id: s.team_id,
        hole_number: hole_numbers[Number(i)],
        strokes: v,
      })),
  );

  const handleSave = () => {
    if (pending.length === 0) return;
    save.mutate(pending, { onSuccess: () => setEdits({}) });
  };

  const played = strokes.filter((s) => s != null).length;
  const total = sumAt(
    strokes,
    pars.map((_, i) => i),
  );
  const toPar = relToPar(strokes, pars);

  const front = pars.map((_, i) => i).slice(0, 9);
  const back = pars.map((_, i) => i).slice(9);

  const scoreBadge = (value: number | null, par: number) => {
    if (value == null)
      return <span className="text-3xl font-bold text-ink-muted/30">–</span>;

    const diff = value - par;
    const base =
      "inline-flex h-12 w-12 items-center justify-center text-3xl font-bold leading-none tabular-nums";

    if (diff <= -2)
      return (
        <span className={`${base} rounded-full bg-rose-600 text-white`}>
          {value}
        </span>
      );
    if (diff === -1)
      return (
        <span
          className={`${base} rounded-full border-2 border-rose-500 text-rose-600`}
        >
          {value}
        </span>
      );
    if (diff === 1)
      return (
        <span className={`${base} border-2 border-ink/70 text-ink`}>
          {value}
        </span>
      );
    if (diff >= 2)
      return (
        <span
          className={`${base} border-2 border-ink/70 outline-2 outline-offset-2 outline-ink/70 text-ink`}
        >
          {value}
        </span>
      );
    return <span className={`${base} text-ink`}>{value}</span>;
  };

  const holeCard = (i: number) => {
    const value = strokes[i];
    const dirty = i in teamEdits && teamEdits[i] !== side.strokes[i];

    return (
      <div
        key={i}
        className={`flex flex-col gap-2 rounded-xl bg-white p-2.5 shadow-sm ring-1 transition-shadow ${
          dirty ? "ring-2 ring-fairway-400" : "ring-fairway-900/5"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-ink">{hole_numbers[i]}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fairway-700">
            Par {pars[i]}
          </span>
        </div>

        <div className="flex h-14 items-center justify-center">
          {scoreBadge(value, pars[i])}
        </div>

        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => bump(i, -1)}
            className="h-8 flex-1 rounded-lg border border-fairway-200 text-lg font-bold text-fairway-700 transition-colors hover:bg-fairway-50 active:bg-fairway-100"
            aria-label={`Decrease hole ${hole_numbers[i]}`}
          >
            −
          </button>
          <button
            type="button"
            onClick={() => setScore(i, null)}
            disabled={value == null}
            className="h-8 w-7 shrink-0 rounded-lg text-sm text-ink-muted/60 transition-colors hover:bg-fairway-50 hover:text-ink-muted disabled:opacity-25 disabled:hover:bg-transparent"
            aria-label={`Clear hole ${hole_numbers[i]}`}
          >
            ×
          </button>
          <button
            type="button"
            onClick={() => bump(i, 1)}
            className="h-8 flex-1 rounded-lg border border-fairway-200 text-lg font-bold text-fairway-700 transition-colors hover:bg-fairway-50 active:bg-fairway-100"
            aria-label={`Increase hole ${hole_numbers[i]}`}
          >
            +
          </button>
        </div>
      </div>
    );
  };

  const nine = (label: string, holes: number[]) =>
    holes.length > 0 && (
      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-fairway-700">
            {label}
          </h2>
          <span className="text-sm font-semibold tabular-nums text-ink-muted">
            {sumAt(strokes, holes) || "–"}
            <span className="text-ink-muted/60"> / {sumAt(pars, holes)}</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">{holes.map(holeCard)}</div>
      </section>
    );

  const matchLabel =
    card.match_number != null ? `Match ${card.match_number}` : "";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 pb-24">
      <div className="flex items-center justify-between">
        <Link
          to={`/matches/${matchId}`}
          className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
        >
          ← Scorecard
        </Link>
        <span className="text-xs font-medium text-ink-muted">
          {card.session_name}
          {matchLabel && ` · ${matchLabel}`}
        </span>
      </div>

      {card.sides.length > 1 && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-fairway-100 p-1">
          {card.sides.map((s) => (
            <button
              key={s.team_id}
              type="button"
              onClick={() => setActiveTeamId(s.team_id)}
              className={`rounded-lg px-3 py-2 text-center transition-colors ${
                s.team_id === side.team_id
                  ? "bg-white shadow-sm"
                  : "hover:bg-fairway-50/60"
              }`}
            >
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-fairway-600">
                {s.team_name}
              </span>
              <span className="block text-sm font-bold leading-tight text-fairway-800">
                {s.players.join(" / ")}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 divide-x divide-fairway-100 rounded-xl bg-white py-4 shadow-sm ring-1 ring-fairway-900/5">
        {[
          { label: "Total", value: played ? total : "–" },
          { label: "To par", value: played ? toPar : "–" },
          { label: "Thru", value: `${played}/${pars.length}` },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-fairway-700">
              {stat.label}
            </span>
            <span
              className={`text-3xl font-extrabold leading-none tabular-nums ${
                stat.label === "To par" && toPar.startsWith("-")
                  ? "text-rose-600"
                  : "text-ink"
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {nine("Front 9", front)}
      {nine("Back 9", back)}

      {save.isError && (
        <p className="text-center text-sm font-medium text-rose-600">
          Couldn&apos;t save scores: {save.error.message}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 mt-1 border-t border-fairway-900/10 bg-canvas/90 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending.length === 0 || save.isPending}
          className="w-full rounded-xl bg-fairway-600 py-3.5 font-bold text-white shadow-sm transition-colors hover:bg-fairway-700 disabled:bg-fairway-200 disabled:text-fairway-600 disabled:shadow-none"
        >
          {save.isPending
            ? "Saving..."
            : pending.length === 0 && save.isSuccess
              ? "Saved ✓"
              : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default EnterScores;
