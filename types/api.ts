// ============================================================
// External API response shapes
// ============================================================

/** Discord OAuth token exchange response */
export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/** Discord user profile from /users/@me */
export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  global_name?: string | null;
}

/** Riot account from /riot/account/v1/accounts/me */
export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

/** LoL summoner from /lol/summoner/v4/summoners/by-puuid/{puuid} */
export interface LolSummoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

/** LoL league entry from /lol/league/v4/entries/by-summoner/{summonerId} */
export interface LolLeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string; // "I", "II", "III", "IV"
  leaguePoints: number;
  wins: number;
  losses: number;
}

/** Faceit player data from /data/v4/players?nickname={username} */
export interface FaceitPlayer {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  games: {
    cs2?: {
      faceit_elo: number;
      skill_level: number;
      game_player_id: string;
      region: string;
    };
  };
}
