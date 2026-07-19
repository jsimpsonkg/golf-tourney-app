import { useEffect, useState } from 'react'
import './App.css'
import TournamentGrid from './components/TournamentGrid/TournamentGrid'
import type { TournamentCardProps } from './components/TournamentCard';
import type { Tournament as ApiTournement } from '@golf/shared';

function App() {
  const [tournaments, setTournaments] = useState<TournamentCardProps[]>([]);
  const apiUrl = import.meta.env.VITE_API_URL;

  async function loadData() {
    await fetch(`${apiUrl}/api/tournaments`)
      .then((res) => res.json())
      .then((body) => {
        const normalizedTournements: TournamentCardProps[] = (body as ApiTournement[]).map((t) => ({
          id: t.id,
          name: t.name,
          img: {src: t.image_url ?? ""},
          description: "Golf Tournement"
        }));

        setTournaments(normalizedTournements);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    loadData();
  }, []);


  return (
    <div className='flex flex-col gap-8'>
      <header className='flex flex-col items-center gap-3 text-center'>
        <span className='inline-flex items-center gap-2 rounded-full bg-fairway-100 px-3 py-1 text-sm font-medium text-fairway-700'>
          ⛳ Season 2026
        </span>
        <h1 className='text-4xl font-extrabold tracking-tight text-fairway-800 sm:text-5xl'>
          Tournament Tracker
        </h1>
        <p className='max-w-md text-ink-muted'>
          Follow every round, leaderboard and result across the season.
        </p>
      </header>

      <TournamentGrid tournaments={tournaments} />
    </div>
  )
}

export default App
