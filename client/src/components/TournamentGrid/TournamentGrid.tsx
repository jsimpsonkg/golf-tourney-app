import type { TournamentGridProps } from "./TournamentGrid.types";
import TournamentCard from "../TournamentCard/TournamentCard";

const TournamentGrid = ({ tournaments }: TournamentGridProps) => {
  return (
    <div className="flex flex-col">
      {tournaments?.map((tournament) => (
        <TournamentCard key={tournament.id} {...tournament} />
      ))}
    </div>
  );
};

export default TournamentGrid;
