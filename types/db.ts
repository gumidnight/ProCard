// ============================================================
// Database row types — mirrors D1 schema exactly
// ============================================================

export interface UserRow {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar_url: string | null;
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: number | null;
  created_at: number;
  updated_at: number;
}

export type ProfileStatus = "on_team" | "open" | "not_looking";

export interface ProfileRow {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  country: string | null;
  tagline: string | null;
  bio: string | null;
  avatar_key: string | null;
  status: ProfileStatus;
  is_published: number; // 0 | 1
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

export type Game = "lol" | "valorant" | "cs2";

export type QueueType =
  | "RANKED_SOLO_5x5"
  | "RANKED_FLEX_5x5"
  | "competitive"
  | "premier";

export interface GameConnectionRow {
  id: string;
  profile_id: string;
  game: Game;

  // Riot
  puuid: string | null;
  account_name: string | null;
  summoner_id: string | null;
  riot_access_token: string | null;
  riot_refresh_token: string | null;
  riot_token_expires_at: number | null;

  // Faceit
  faceit_player_id: string | null;
  faceit_nickname: string | null;

  // Rank snapshot
  rank_tier: string | null;
  rank_division: string | null;
  lp_rr: number | null;
  skill_level: number | null;

  // Peak rank
  peak_rank_tier: string | null;
  peak_rank_division: string | null;

  queue_type: QueueType;
  last_refreshed_at: number | null;
  created_at: number;
  updated_at: number;
}

export type SocialPlatform =
  | "discord"
  | "twitch"
  | "twitter"
  | "youtube"
  | "opgg"
  | "tracker";

export interface SocialLinkRow {
  id: string;
  profile_id: string;
  platform: SocialPlatform;
  handle_or_url: string;
  display_order: number;
  created_at: number;
}

export interface TeamHistoryRow {
  id: string;
  profile_id: string;
  org_name: string;
  role: string | null;
  game: string;
  start_date: string | null;
  end_date: string | null;
  result_note: string | null;
  display_order: number;
  created_at: number;
}

export interface RolePlayedRow {
  id: string;
  profile_id: string;
  game: string;
  role: string;
  is_main: number; // 0 | 1
  display_order: number;
}
