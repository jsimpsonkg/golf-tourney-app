import { Link } from "react-router-dom";
import type { TournamentCardProps } from "./TournamentCard.types";

const TournamentCard = ({ id, name, img, description }: TournamentCardProps) => {
  return (
    <Link to={`/tournaments/${id}`}>
      <div className="m-3 shadow-lg rounded-md">
        <div>{name}</div>
        {img ? <img src={img.src} alt={name} className="rounded-md"/> : null}
        {description ? <p>{description}</p> : null}
      </div>
    </Link>
  );
};

export default TournamentCard;
