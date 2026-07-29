import TournamentGrid from "../components/TournamentGrid/TournamentGrid";
import type { TournamentCardProps } from "../components/TournamentCard";
import { useTournaments } from "../api/tournaments";

function Home() {
  const { data: tournaments, isLoading, error } = useTournaments();

  const cards: TournamentCardProps[] = (tournaments ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    img: { src: t.image_url ?? "" },
    description: "Golf Tournement",
  }));

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-fairway-100 px-3 py-1 text-sm font-medium text-fairway-700">
          ⛳ Season 2026
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight text-fairway-800 sm:text-5xl">
          Tournament Tracker
        </h1>
        <p className="max-w-md text-ink-muted">
          Follow every round, leaderboard and result across the season.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
          Loading tournaments...
        </div>
      ) : error ? (
        <div className="rounded-xl bg-white p-6 text-center text-ink-muted shadow-sm ring-1 ring-fairway-900/5">
          {error.message}
        </div>
      ) : (
        <TournamentGrid tournaments={cards} />
      )}
    </div>
  );
}

export default Home;
