import type { TournamentGridProps } from "./TournamentGrid.types";
import TournamentCard from "../TournamentCard/TournamentCard";

const TournamentGrid = ({ tournaments }: TournamentGridProps) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {tournaments?.map((tournament) => (
        <TournamentCard key={tournament.id} {...tournament} />
      ))}
    </div>
  );
};

export default TournamentGrid;
