import { useParams } from "react-router-dom";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import Scorecard from "../components/Scorecard/Scorecard";
import PlayerNames from "../components/PlayerNames";
import { useMatchScorecard } from "../api/matches";

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

  // Show who's leading instead of a bare "3&2"; all-square has no leader
  // and reads "Halved" once the match is done.
  const { result, sides } = card;
  const leaderName = result.leading_team_id
    ? (sides.find((s) => s.team_id === result.leading_team_id)?.team_name ??
      null)
    : null;

  // Each nine banks its own points, so a finished match is decided on the
  // total. status_label already spells out both nines ("Front 9: 3&2 · Back
  // 9: AS"); prefix it with who took the match overall.
  const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));
  const ranked = [...(result.points ?? [])].sort((x, y) => y.points - x.points);
  const [best, rest] = ranked;

  let status: string;
  if (result.state === "not_started") {
    status = "Not started";
  } else if (result.state === "completed" && best && rest) {
    const winnerName =
      sides.find((s) => s.team_id === best.team_id)?.team_name ?? null;
    status =
      best.points === rest.points
        ? `Halved ${fmt(best.points)}-${fmt(rest.points)} · ${result.status_label}`
        : `${winnerName} wins ${fmt(best.points)}-${fmt(rest.points)} · ${result.status_label}`;
  } else if (leaderName == null) {
    status = `All square thru ${result.holes_played}`;
  } else {
    status = `${leaderName} · ${result.status_label}`;
  }

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

        <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-fairway-900/5">
          <span className="text-sm font-medium text-ink-muted">Status</span>
          <span className="text-sm font-bold text-fairway-700">{status}</span>
        </div>
      </div>
    </div>
  );
};

export default ViewScores;
