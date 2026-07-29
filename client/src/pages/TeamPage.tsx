import { useEffect } from "react";
import type { MatchState, RoundMatch, RoundSession } from "@golf/shared";
import { Link, useNavigate, useParams } from "react-router-dom";
import TeamMatchCard from "../components/TeamMatchCard/TeamMatchCard";
import type { Result } from "../components/TeamMatchCard/TeamMatchCard.types";
import { Tabs } from "../components/Tabs";
import { useTeamPage } from "../api/tournaments";
import { useStickyTab } from "../hooks/useStickyTab";

// Turn a round match into TeamMatchCard props, seen from teamId's side
// (opponent is the other team, win/loss is relative to us).
function toCardProps(match: RoundMatch, session: RoundSession, teamId: string) {
  const { result } = match;

  const teamMembers = match.participants
    .filter((p) => p.team_id === teamId)
    .map((p) => p.player_name)
    .join(" / ");

  const opponent = match.participants
    .filter((p) => p.team_id !== teamId)
    .map((p) => p.player_name)
    .join(" / ");

  let outcome: Result;
  if (result.state === "not_started") {
    outcome = "upcoming";
  } else if (result.state === "in_progress") {
    outcome = "live";
  } else if (result.leading_team_id === null) {
    outcome = "halved";
  } else if (result.leading_team_id === teamId) {
    outcome = "win";
  } else {
    outcome = "loss";
  }

  // status_label reads from the leader's side ("2 up thru 3"), so flip "up" to
  // "down" when we're the trailing team. "AS" and "3&2" don't need it.
  const trailing =
    result.leading_team_id !== null && result.leading_team_id !== teamId;
  const statusLabel = trailing
    ? result.status_label.replace(" up", " down")
    : result.status_label;

  return {
    id: match.id,
    session: session.name ?? session.session_type ?? "Match",
    teamMembers,
    opponent,
    result: outcome,
    statusLabel,
  };
}

// completed first, then live, then upcoming.
const STATE_ORDER: Record<MatchState, number> = {
  completed: 0,
  in_progress: 1,
  not_started: 2,
};

const TeamPage = () => {
  const { id, teamId } = useParams<{ id: string; teamId: string }>();
  const navigate = useNavigate();
  const { data: teamInfo, isLoading, error } = useTeamPage(id, teamId);

  const [, rememberTeam] = useStickyTab(`teams:${id}`);
  useEffect(() => {
    if (teamId) rememberTeam(teamId);
  }, [teamId, rememberTeam]);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        Loading tournament...
      </div>
    );
  }

  if (error || !teamInfo) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
        {error ? error.message : "Team Information not found."}
      </div>
    );
  }

  // One flat list across sessions, ordered by state. sort() is stable, so
  // matches keep their session/match order within each group.
  const matches = teamInfo.sessions
    .flatMap((session) => session.matches.map((match) => ({ match, session })))
    .sort(
      (a, b) =>
        STATE_ORDER[a.match.result.state] - STATE_ORDER[b.match.result.state],
    );

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={`/tournaments/${id}`}
        className="text-sm font-semibold text-fairway-600 hover:text-fairway-700"
      >
        ← Standings
      </Link>

      <Tabs
        ariaLabel="Teams"
        value={teamInfo.team.id}
        tabs={teamInfo.teams.map((t) => ({ label: t.name, value: t.id }))}
        onChange={(nextTeamId) =>
          navigate(`/tournaments/${id}/teams/${nextTeamId}`)
        }
      />
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-fairway-600 p-6 text-white shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight">
          {teamInfo.team.name}
        </h1>
        <div className="text-right">
          <div className="text-4xl font-extrabold tabular-nums">
            {teamInfo.points}
          </div>
          <div className="text-sm opacity-80">points</div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Roster</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {teamInfo.players.map((player) => (
            <li
              key={player.id}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-fairway-800 shadow-sm ring-1 ring-fairway-900/5"
            >
              {player.name}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">Matches</h2>
        <ul className="flex flex-col gap-3">
          {matches.map(({ match, session }) => (
            <TeamMatchCard
              key={match.id}
              {...toCardProps(match, session, teamInfo.team.id)}
            />
          ))}
        </ul>
      </section>
    </div>
  );
};

export default TeamPage;
