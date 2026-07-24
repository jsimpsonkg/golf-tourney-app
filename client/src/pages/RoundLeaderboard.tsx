import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { MatchState } from "@golf/shared";
import { Tabs } from "../components/Tabs";

// ---------------------------------------------------------------------------
// HARDCODED FIXTURE — remove once the leaderboard endpoint exists.
// The server currently exposes no computed-leaderboard route, so this page
// renders a static, display-ready shape. Replace `ROUNDS` / `STANDINGS` with
// data derived from a `LeaderboardView` fetch, keyed on the tournament id.
// ---------------------------------------------------------------------------

type Side = "A" | "B";

interface LeaderboardMatchRow {
  matchId: string;
  matchNumber: number;
  players: Record<Side, string[]>;
  state: MatchState;
  /** e.g. "3&2", "2 up thru 14", "AS". */
  statusLabel: string;
  /** Side currently ahead, or null when all-square / halved. */
  leader: Side | null;
}

interface RoundFixture {
  id: string;
  name: string;
  pointValue: number;
  matches: LeaderboardMatchRow[];
}

const TEAMS: Record<Side, string> = { A: "USA", B: "Europe" };

const STANDINGS: Record<Side, number> = { A: 4.5, B: 3.5 };

const ROUNDS: RoundFixture[] = [
  {
    id: "s1",
    name: "Foursomes",
    pointValue: 1,
    matches: [
      {
        matchId: "m1",
        matchNumber: 1,
        players: { A: ["Scheffler", "Cantlay"], B: ["McIlroy", "Fleetwood"] },
        state: "completed",
        statusLabel: "3&2",
        leader: "A",
      },
      {
        matchId: "m2",
        matchNumber: 2,
        players: { A: ["Schauffele", "Homa"], B: ["Rahm", "Hovland"] },
        state: "completed",
        statusLabel: "1 up",
        leader: "B",
      },
      {
        matchId: "m3",
        matchNumber: 3,
        players: { A: ["Thomas", "Spieth"], B: ["Lowry", "Straka"] },
        state: "completed",
        statusLabel: "AS",
        leader: null,
      },
    ],
  },
  {
    id: "s2",
    name: "Fourball",
    pointValue: 1,
    matches: [
      {
        matchId: "m4",
        matchNumber: 1,
        players: { A: ["Scheffler", "Schauffele"], B: ["McIlroy", "Rahm"] },
        state: "in_progress",
        statusLabel: "2 up thru 14",
        leader: "A",
      },
      {
        matchId: "m5",
        matchNumber: 2,
        players: { A: ["Cantlay", "Thomas"], B: ["Hovland", "Fleetwood"] },
        state: "in_progress",
        statusLabel: "1 dn thru 11",
        leader: "B",
      },
    ],
  },
  {
    id: "s3",
    name: "Singles",
    pointValue: 1,
    matches: [
      {
        matchId: "m6",
        matchNumber: 1,
        players: { A: ["Scheffler"], B: ["McIlroy"] },
        state: "not_started",
        statusLabel: "Tee time 12:05",
        leader: null,
      },
    ],
  },
];

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

const RoundLeaderboard = () => {
  const { id } = useParams<{ id: string }>();
  const [activeRoundId, setActiveRoundId] = useState(ROUNDS[0].id);
  const round = ROUNDS.find((r) => r.id === activeRoundId) ?? ROUNDS[0];

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
          <div className="flex items-center gap-3 text-lg font-bold">
            <span className="text-fairway-800">{TEAMS.A}</span>
            <span className="rounded-lg bg-white px-3 py-1 shadow-sm ring-1 ring-fairway-900/5">
              {STANDINGS.A} <span className="text-ink-muted">–</span> {STANDINGS.B}
            </span>
            <span className="text-fairway-800">{TEAMS.B}</span>
          </div>
        </div>

        <Tabs
          ariaLabel="Rounds"
          tabs={ROUNDS.map((r) => ({ label: r.name, value: r.id }))}
          value={activeRoundId}
          onChange={setActiveRoundId}
        />
      </header>

      <ul className="flex flex-col gap-3">
        {round.matches.map((match) => (
          <li key={match.matchId}>
           <Link
            to={`/matches/${match.matchId}`}
            className="block rounded-xl bg-white p-4 shadow-sm ring-1 ring-fairway-900/5 transition hover:-translate-y-0.5 hover:shadow-md"
           >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-ink-muted">
                Match {match.matchNumber}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${stateStyles[match.state]}`}
              >
                {stateLabels[match.state]}
              </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <span
                className={`text-right text-sm ${
                  match.leader === "A"
                    ? "font-bold text-fairway-800"
                    : "text-ink-muted"
                }`}
              >
                {match.players.A.join(" / ")}
              </span>
              <span className="rounded-md bg-fairway-50 px-2.5 py-1 text-center text-sm font-semibold text-fairway-700 whitespace-nowrap">
                {match.statusLabel}
              </span>
              <span
                className={`text-left text-sm ${
                  match.leader === "B"
                    ? "font-bold text-fairway-800"
                    : "text-ink-muted"
                }`}
              >
                {match.players.B.join(" / ")}
              </span>
            </div>
           </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RoundLeaderboard;
