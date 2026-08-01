import { useParams } from "react-router-dom";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import Scorecard from "../components/Scorecard/Scorecard";
import PlayerNames from "../components/PlayerNames";
import { useMatchScorecard } from "../api/matches";
import { formatPoints, pointsByTeam, toNineRows } from "../utils/nineStatus";

const FRONT = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const BACK = [9, 10, 11, 12, 13, 14, 15, 16, 17];

const ViewScores = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { data: card, isLoading, error } = useMatchScorecard(matchId);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        Loading scorecard...
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        {error
          ? error.message
          : "Scorecard not found. Try going back to the home page."}
      </div>
    );
  }

  const { result, sides } = card;
  const teamName = (teamId: string | null) =>
    teamId ? (sides.find((s) => s.team_id === teamId)?.team_name ?? null) : null;

  // Each nine is its own contest, so report them on separate lines instead of
  // one combined status. Name the leader rather than showing a bare "3&2".
  const nineRows = toNineRows(result).map((n) => {
    const leader = teamName(n.leadingTeamId);
    let text: string;
    if (n.state === "not_started") {
      text = "Not started";
    } else if (leader == null) {
      text = n.state === "completed" ? "Halved" : n.status;
    } else {
      text =
        n.state === "completed"
          ? `${leader} wins ${n.status}`
          : `${leader} · ${n.status}`;
    }
    return { label: n.label, text };
  });

  // Match total across decided nines, e.g. "Ruven's team 2 - 0 Isaiah's team".
  const totals = pointsByTeam(result);
  const matchTotal =
    result.points == null
      ? null
      : sides
          .map(
            (s) =>
              `${s.team_name} ${formatPoints(totals.get(s.team_id ?? "") ?? 0)}`,
          )
          .join(" · ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/tournaments/${card.tournament_id}/leaderboard`}
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

      <header className="flex flex-col items-center gap-5 text-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800">
            Scorecard
          </h1>
          <p className="text-ink-muted">{card.session_name}</p>
        </div>
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3">
          {card.sides.map((side, idx) => (
            <Fragment key={side.team_id ?? idx}>
              {idx > 0 && (
                <span className="text-sm font-medium text-ink-muted">vs</span>
              )}
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-semibold text-fairway-800">
                  {side.team_name}
                </span>
                <Link
                  to={`/matches/${matchId}/teams/${idx}`}
                  className="rounded-full bg-fairway-50 px-4 py-1.5 ring-1 ring-fairway-200 transition-colors hover:bg-fairway-100"
                >
                  <PlayerNames
                    names={side.players}
                    className="text-sm font-semibold text-fairway-700"
                  />
                </Link>
              </div>
            </Fragment>
          ))}
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <Scorecard label="Front 9" holes={FRONT} totalLabel="Out" card={card} />
        <Scorecard label="Back 9" holes={BACK} totalLabel="In" card={card} />

        {/* Each nine is worth its own point, so each gets its own status line. */}
        <div className="flex flex-col divide-y divide-fairway-900/5 rounded-xl bg-white px-4 shadow-sm ring-1 ring-fairway-900/5">
          {nineRows.map((n) => (
            <div
              key={n.label}
              className="flex items-center justify-between gap-3 py-3"
            >
              <span className="text-sm font-medium text-ink-muted">
                {n.label}
              </span>
              <span className="text-right text-sm font-bold text-fairway-700">
                {n.text}
              </span>
            </div>
          ))}
          {matchTotal ? (
            <div className="flex items-center justify-between gap-3 py-3">
              <span className="text-sm font-medium text-ink-muted">Points</span>
              <span className="text-right text-sm font-bold text-fairway-700">
                {matchTotal}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ViewScores;
