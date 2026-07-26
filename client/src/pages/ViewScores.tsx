import type { MatchScorecard } from "@golf/shared";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { matchStatus } from "../utils/scorecardUtils";
import { Link } from "react-router-dom";
import Scorecard from "../components/Scorecard/Scorecard";

const FRONT = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const BACK = [9, 10, 11, 12, 13, 14, 15, 16, 17];

const ViewScores = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const { matchId } = useParams<{ matchId: string }>();

  const [card, setCard] = useState<MatchScorecard>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiUrl}/api/matches/${matchId}/scores`);
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        setCard((await response.json()) as MatchScorecard);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Failed to load scorecard",
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [apiUrl, matchId]);

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
        {error ?? "Scorecard not found. Try going back to the home page."}
      </div>
    );
  }

  const status = matchStatus(card.sides);

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
          <p className="text-ink-muted">
            {card.session_name} · {card.match_number}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 text-sm">
          {card.sides.map((side, idx) => (
            <div key={side.team_id ?? idx} className="flex items-center gap-3">
              {idx > 0 && <span className="text-ink-muted">vs</span>}
              <Link
                to={`/matches/${matchId}/teams/${idx}`}
                className="inline-flex items-center rounded-full bg-fairway-50 px-3 py-1 font-semibold text-fairway-700 ring-1 ring-fairway-200 transition-colors hover:bg-fairway-100"
              >
                <div className="flex flex-wrap items-center gap-1 whitespace-nowrap">
                  {side.players.map((player, idx2, arr2) => (
                    <span key={player} className="inline-flex items-center">
                      {player}
                      {idx2 < arr2.length - 1 && (
                        <span className="ml-1 text-ink-muted">/</span>
                      )}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
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
