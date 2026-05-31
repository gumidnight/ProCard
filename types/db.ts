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

export type EsportsRole =
  | "player"
  | "coach"
  | "analyst"
  | "team_owner"
  | "team_manager"
  | "commentator"
  | "caster"
  | "host"
  | "media_manager"
  | "content_creator"
  | "journalist"
  | "tournament_organizer"
  | "referee"
  | "scout"
  | "agent"
  | "streamer"
  | "designer"
  | "observer";

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
  /** Optional free-form "currently" description (e.g. "Mid laner for C9", "LF EUW mid"). */
  status_note: string | null;
  /** When status === "on_team": current team display fields (decoupled from team_history). */
  current_team_name: string | null;
  current_team_logo_url: string | null;
  current_league: string | null;
  current_role: string | null;
  current_game: string | null;
  /** Comma-separated list of {@link EsportsRole} values. Use `parseRoles`/`formatRoles` from `lib/utils/esports-roles`. */
  esports_role: string | null;
  /** Verified player badge. Admin/DB-set only — never user-editable (no self-verify). */
  is_verified: number; // 0 | 1
  /** Reserved for future pro-gating. NOT enforced anywhere yet. */
  is_pro: number; // 0 | 1
  /** Uploaded banner image key (served via /api/profile/banner). */
  banner_key: string | null;
  /** Background source: house default, a named preset, or a custom upload. */
  background_type: "default" | "preset" | "custom";
  /** Preset id (from BACKGROUND_PRESETS) when background_type === "preset". */
  background_preset: string | null;
  /** Uploaded background image key (served via /api/profile/background) when background_type === "custom". */
  background_key: string | null;
  /** Riot platform region (na1, euw1, eun1, kr, …) — used for rank API routing. */
  region: string | null;
  is_published: number; // 0 | 1
  published_at: number | null;
  created_at: number;
  updated_at: number;
}

export type Game = "lol" | "valorant" | "tft" | "cs2";

export type QueueType =
  | "RANKED_SOLO_5x5"
  | "RANKED_FLEX_5x5"
  | "competitive"
  | "premier"
  | "RANKED_TFT";

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

  region: string | null;

  queue_type: QueueType;
  is_visible: number; // 1 = shown on public profile, 0 = hidden
  last_refreshed_at: number | null;
  created_at: number;
  updated_at: number;
}

export type SocialPlatform =
  | "discord"
  | "twitch"
  | "twitter"
  | "youtube"
  | "instagram"
  | "tiktok"
  | "kick"
  | "liquipedia"
  | "opgg"
  | "tracker"
  | "website";

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
  /** Optional tournament / league name (e.g. "LCS Spring 2024"). */
  tournament_name: string | null;
  /** Optional external URL to the org's logo (PNG/SVG). */
  org_logo_url: string | null;
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

export interface ProfileViewRow {
  id: string;
  profile_id: string;
  visitor_id: string;
  created_at: number;
}

export interface ProfileLikeRow {
  id: string;
  profile_id: string;
  visitor_id: string;
  created_at: number;
}

export interface ProfileCommentRow {
  id: string;
  profile_id: string;
  user_id: string;
  body: string;
  created_at: number;
}

/** Comment joined with the author's public-safe user fields. */
export interface ProfileCommentWithAuthor extends ProfileCommentRow {
  author_username: string;
  author_avatar_url: string | null;
  author_slug: string | null;
}
