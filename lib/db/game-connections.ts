import { getDb, ensureMigrated } from "./client";
import type { GameConnectionRow } from "@/types/db";

// ---------------------------------------------------------------------------
// Game connection queries
// ---------------------------------------------------------------------------

export function upsertGameConnection(data: {
  id: string;
  profile_id: string;
  game: GameConnectionRow["game"];
  puuid?: string | null;
  account_name?: string | null;
  summoner_id?: string | null;
  riot_access_token?: string | null;
  riot_refresh_token?: string | null;
  riot_token_expires_at?: number | null;
  faceit_player_id?: string | null;
  faceit_nickname?: string | null;
  rank_tier?: string | null;
  rank_division?: string | null;
  lp_rr?: number | null;
  skill_level?: number | null;
  queue_type?: GameConnectionRow["queue_type"];
}): GameConnectionRow {
  ensureMigrated();
  const db = getDb();

  const existing = db
    .prepare(
      "SELECT * FROM game_connections WHERE profile_id = ? AND game = ?",
    )
    .get(data.profile_id, data.game) as GameConnectionRow | undefined;

  if (existing) {
    db.prepare(
      `UPDATE game_connections
       SET puuid = COALESCE(?, puuid),
           account_name = COALESCE(?, account_name),
           summoner_id = COALESCE(?, summoner_id),
           riot_access_token = COALESCE(?, riot_access_token),
           riot_refresh_token = COALESCE(?, riot_refresh_token),
           riot_token_expires_at = COALESCE(?, riot_token_expires_at),
           faceit_player_id = COALESCE(?, faceit_player_id),
           faceit_nickname = COALESCE(?, faceit_nickname),
           rank_tier = COALESCE(?, rank_tier),
           rank_division = COALESCE(?, rank_division),
           lp_rr = COALESCE(?, lp_rr),
           skill_level = COALESCE(?, skill_level),
           queue_type = COALESCE(?, queue_type),
           last_refreshed_at = unixepoch(),
           updated_at = unixepoch()
       WHERE profile_id = ? AND game = ?`,
    ).run(
      data.puuid ?? null,
      data.account_name ?? null,
      data.summoner_id ?? null,
      data.riot_access_token ?? null,
      data.riot_refresh_token ?? null,
      data.riot_token_expires_at ?? null,
      data.faceit_player_id ?? null,
      data.faceit_nickname ?? null,
      data.rank_tier ?? null,
      data.rank_division ?? null,
      data.lp_rr ?? null,
      data.skill_level ?? null,
      data.queue_type ?? null,
      data.profile_id,
      data.game,
    );
    return db
      .prepare(
        "SELECT * FROM game_connections WHERE profile_id = ? AND game = ?",
      )
      .get(data.profile_id, data.game) as GameConnectionRow;
  }

  db.prepare(
    `INSERT INTO game_connections
       (id, profile_id, game, puuid, account_name, summoner_id,
        riot_access_token, riot_refresh_token, riot_token_expires_at,
        faceit_player_id, faceit_nickname,
        rank_tier, rank_division, lp_rr, skill_level, queue_type,
        last_refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
  ).run(
    data.id,
    data.profile_id,
    data.game,
    data.puuid ?? null,
    data.account_name ?? null,
    data.summoner_id ?? null,
    data.riot_access_token ?? null,
    data.riot_refresh_token ?? null,
    data.riot_token_expires_at ?? null,
    data.faceit_player_id ?? null,
    data.faceit_nickname ?? null,
    data.rank_tier ?? null,
    data.rank_division ?? null,
    data.lp_rr ?? null,
    data.skill_level ?? null,
    data.queue_type ?? "RANKED_SOLO_5x5",
  );

  return db
    .prepare("SELECT * FROM game_connections WHERE id = ?")
    .get(data.id) as GameConnectionRow;
}

export function findGameConnectionsByProfileId(
  profileId: string,
): GameConnectionRow[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare("SELECT * FROM game_connections WHERE profile_id = ?")
    .all(profileId) as GameConnectionRow[];
}

export function deleteGameConnection(
  profileId: string,
  game: string,
): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(
    "DELETE FROM game_connections WHERE profile_id = ? AND game = ?",
  ).run(profileId, game);
}
