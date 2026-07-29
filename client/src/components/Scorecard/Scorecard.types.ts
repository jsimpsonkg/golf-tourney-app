import type { MatchScorecard } from "@golf/shared";

export type ScorecardProps = {
  label: string;
  totalLabel: string;
  holes: number[];
  card: MatchScorecard;
};
