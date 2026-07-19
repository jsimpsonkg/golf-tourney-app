import { Link } from "react-router-dom";
import type { TournamentCardProps } from "./TournamentCard.types";

const TournamentCard = ({ id, name, img, description }: TournamentCardProps) => {
  return (
    <Link to={`/tournaments/${id}`} className="group block">
      <div className="overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-fairway-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-video overflow-hidden bg-fairway-100">
          {img?.src ? (
            <img
              src={img.src}
              alt={name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-fairway-600 text-4xl text-white/80">
              ⛳
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-fairway-800 transition-colors group-hover:text-fairway-600">
            {name}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          ) : null}
        </div>
      </div>
    </Link>
  );
};

export default TournamentCard;
