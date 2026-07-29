export type Result = "win" | "loss" | "halved" | "live" | "upcoming";

export interface TeamMatchCardProps {
  id: string;
  session: string;
  teamMembers: string;
  opponent: string;
  result: Result;
  statusLabel: string;
}
