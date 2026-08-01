import { Link, useParams } from "react-router-dom";
import type { RoundMatch } from "@golf/shared";
import { Tabs } from "../components/Tabs";
import MatchCard from "../components/MatchCard/MatchCard";
import type {
  LeaderboardMatchRow,
  Side,
} from "../components/MatchCard/MatchCard.types";
import { useRounds } from "../api/tournaments";
import { useStickyTab } from "../hooks/useStickyTab";

const RoundLeaderboard = () => {
  const { id } = useParams<{ id: string }>();
  const { data: rounds, isLoading, error } = useRounds(id);
  const [activeRoundId, setActiveRoundId] = useStickyTab(`rounds:${id}`);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        Loading leaderboard...
      </div>
    );
  }

  if (error || !rounds || rounds.sessions.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        {error
          ? error.message
          : "No rounds found. Try going back to the home page."}
      </div>
    );
  }

  // The two teams anchor the left (A) / right (B) columns consistently across
  // every match. team_id → side lookup; teamA is whichever team comes first.
  const [teamA, teamB] = rounds.teams;
  const sideOf = (teamId: string): Side => (teamId === teamB?.id ? "B" : "A");

  const toRow = (match: RoundMatch): LeaderboardMatchRow => {
    const players: Record<Side, string[]> = { A: [], B: [] };
    for (const p of match.participants) {
      players[sideOf(p.team_id)].push(p.player_name);
    }
    const { result } = match;
    return {
      matchId: match.id,
      matchNumber: match.match_number,
      players,
      state: result.state,
      // Keep the "vs" placeholder before play begins; otherwise show the
      // engine's match-play status ("3&2", "2 up thru 14", "AS").
      statusLabel: result.state === "not_started" ? "vs" : result.status_label,
      leader: result.leading_team_id ? sideOf(result.leading_team_id) : null,
    };
  };

  const activeSession =
    rounds.sessions.find((s) => s.id === activeRoundId) ?? rounds.sessions[0];

  // Header bubble shows the selected round's points, so it moves with the tabs.
  const teamPoints = (teamId: string | undefined) =>
    activeSession.standings.find((s) => s.team_id === teamId)?.points ?? 0;
  const aPts = teamPoints(teamA?.id);
  const bPts = teamPoints(teamB?.id);
  const scoreStyles = (points: number, other: number) =>
    points >= other ? "text-fairway-800" : "text-ink-muted";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <Link
          to={`/tournaments/${id}`}
          className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
        >
          ← Standings
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-fairway-800">
            Leaderboard
          </h1>
          <div className="flex items-center gap-2.5 text-lg font-bold text-fairway-800">
            <span>{teamA?.name ?? "Team A"}</span>
            <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-extrabold tabular-nums shadow-sm ring-1 ring-fairway-900/10">
              <span className={scoreStyles(aPts, bPts)}>{aPts}</span>
              <span className="font-medium text-ink-muted">–</span>
              <span className={scoreStyles(bPts, aPts)}>{bPts}</span>
            </span>
            <span>{teamB?.name ?? "Team B"}</span>
          </div>
        </div>

        <Tabs
          ariaLabel="Rounds"
          tabs={rounds.sessions.map((s) => ({
            label: s.name ?? "Round",
            value: s.id,
          }))}
          value={activeSession.id}
          onChange={setActiveRoundId}
        />

        {/* Rounds can be at different courses, so name the one in view. */}
        {activeSession.course_name ? (
          <p className="self-center text-sm text-ink-muted">
            {activeSession.course_name}
          </p>
        ) : null}
      </header>

      <ul className="flex flex-col gap-3">
        {activeSession.matches.map((match) => (
          <li key={match.id}>
            <MatchCard {...toRow(match)} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoundLeaderboard;
