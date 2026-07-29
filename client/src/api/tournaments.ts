import { useQuery } from "@tanstack/react-query";
import type {
  Tournament,
  TournamentDetail,
  RoundsView,
  TeamPageInfo,
} from "@golf/shared";
import { apiGet, LIVE_REFETCH_MS } from "./client";

// Centralized query keys so cache reads/invalidations stay consistent.
export const tournamentKeys = {
  all: ["tournaments"] as const,
  detail: (id: string) => ["tournaments", id] as const,
  rounds: (id: string) => ["tournaments", id, "rounds"] as const,
  team: (id: string, teamId: string) =>
    ["tournaments", id, "teams", teamId] as const,
};

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.all,
    queryFn: () => apiGet<Tournament[]>("/api/tournaments"),
  });
}

export function useTournament(id: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.detail(id ?? ""),
    queryFn: () => apiGet<TournamentDetail>(`/api/tournaments/${id}`),
    enabled: !!id,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useRounds(id: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.rounds(id ?? ""),
    queryFn: () => apiGet<RoundsView>(`/api/tournaments/${id}/rounds`),
    enabled: !!id,
    refetchInterval: LIVE_REFETCH_MS,
  });
}

export function useTeamPage(
  id: string | undefined,
  teamId: string | undefined,
) {
  return useQuery({
    queryKey: tournamentKeys.team(id ?? "", teamId ?? ""),
    queryFn: () =>
      apiGet<TeamPageInfo>(`/api/tournaments/${id}/teams/${teamId}`),
    enabled: !!id && !!teamId,
    refetchInterval: LIVE_REFETCH_MS,
  });
}
