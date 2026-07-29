import { useQuery } from "@tanstack/react-query";
import type { MatchScorecard } from "@golf/shared";
import { apiGet, LIVE_REFETCH_MS } from "./client";

export const matchKeys = {
  scorecard: (matchId: string) => ["matches", matchId, "scores"] as const,
};

// Shared by ViewScores and TeamScores — same key, so react-query serves both
// from one cached fetch and one poll loop.
export function useMatchScorecard(matchId: string | undefined) {
  return useQuery({
    queryKey: matchKeys.scorecard(matchId ?? ""),
    queryFn: () => apiGet<MatchScorecard>(`/api/matches/${matchId}/scores`),
    enabled: !!matchId,
    refetchInterval: LIVE_REFETCH_MS,
  });
}
