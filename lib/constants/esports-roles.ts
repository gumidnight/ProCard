// Shared esports role constants — safe for client import.

import type { EsportsRole } from "@/types/db";

export const ESPORTS_ROLES: { value: EsportsRole; label: string }[] = [
  { value: "player", label: "Player" },
  { value: "coach", label: "Coach" },
  { value: "analyst", label: "Analyst" },
  { value: "team_owner", label: "Team Owner" },
  { value: "team_manager", label: "Team Manager" },
  { value: "commentator", label: "Commentator" },
  { value: "caster", label: "Caster" },
  { value: "host", label: "Host" },
  { value: "media_manager", label: "Media Manager" },
  { value: "content_creator", label: "Content Creator" },
  { value: "journalist", label: "Journalist" },
  { value: "tournament_organizer", label: "Tournament Organizer" },
  { value: "referee", label: "Referee" },
  { value: "scout", label: "Scout" },
  { value: "agent", label: "Agent" },
  { value: "streamer", label: "Streamer" },
  { value: "designer", label: "Designer" },
  { value: "observer", label: "Observer" },
];
