import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MatchScorecard,
  SaveScoresResponse,
  ScoreEntryInput,
} from "@golf/shared";
import { apiGet, apiPost, LIVE_REFETCH_MS } from "./client";
import { tournamentKeys } from "./tournaments";

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

export function useSaveMatchScores(matchId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entries: ScoreEntryInput[]) =>
      apiPost<SaveScoresResponse>(`/api/matches/${matchId}/scores`, {
        entries,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: matchKeys.scorecard(matchId ?? ""),
        }),
        queryClient.invalidateQueries({ queryKey: tournamentKeys.all }),
      ]),
  });
}
