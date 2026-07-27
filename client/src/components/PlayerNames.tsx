import { Fragment } from "react";

type PlayerNamesProps = {
  names: string[];
  className?: string;
};

// Renders "A / B" and keeps each "/" glued to the name before it, so a line
// can only ever wrap after the slash, never leaving a "/" stranded.
const PlayerNames = ({ names, className }: PlayerNamesProps) => (
  <span className={className}>
    {names.map((name, i) => (
      <Fragment key={i}>
        {i > 0 && " "}
        <span className="whitespace-nowrap">
          {name}
          {i < names.length - 1 && " /"}
        </span>
      </Fragment>
    ))}
  </span>
);

export default PlayerNames;
