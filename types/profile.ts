// ============================================================
// Composed profile types for UI rendering
// ============================================================

import type {
  ProfileRow,
  GameConnectionRow,
  SocialLinkRow,
  TeamHistoryRow,
  RolePlayedRow,
  ProfileStatus,
} from "./db";

/** Full public profile — everything needed to render /[slug] */
export interface PublicProfile {
  profile: ProfileRow;
  gameConnections: GameConnectionRow[];
  socialLinks: SocialLinkRow[];
  teamHistory: TeamHistoryRow[];
  rolesPlayed: RolePlayedRow[];
  avatarUrl: string | null; // resolved R2 URL or Discord CDN fallback
}

/** Rank display data for a single game card */
export interface RankDisplay {
  game: GameConnectionRow["game"];
  accountName: string;
  tier: string;
  division: string | null;
  lpRr: number | null;
  skillLevel: number | null;
  queueType: string;
  lastRefreshedAt: number | null;
  colour: string; // resolved from rank tier → colour map
}

/** Status badge config */
export interface StatusBadgeConfig {
  status: ProfileStatus;
  label: string;
  dotColour: string;
}
