import { getDb, ensureMigrated } from "./client";
import type { GameConnectionRow } from "@/types/db";

// ---------------------------------------------------------------------------
// Game connection queries
// ---------------------------------------------------------------------------

/**
 * Add or update a game connection.
 * Deduplication key:
 *   - Riot (lol/valorant/tft): (profile_id, game, puuid)
 *   - CS2 (faceit):             (profile_id, game, faceit_nickname)
 * If the same account already exists, rank data is updated in place.
 * Otherwise a new row is inserted with the provided `id`.
 */
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
  region?: string | null;
  queue_type?: GameConnectionRow["queue_type"];
}): GameConnectionRow {
  ensureMigrated();
  const db = getDb();

  // Find existing by the natural deduplication key
  let existing: GameConnectionRow | undefined;
  if (data.puuid) {
    existing = db
      .prepare(
        "SELECT * FROM game_connections WHERE profile_id = ? AND game = ? AND puuid = ?",
      )
      .get(data.profile_id, data.game, data.puuid) as GameConnectionRow | undefined;
  } else if (data.faceit_nickname) {
    existing = db
      .prepare(
        "SELECT * FROM game_connections WHERE profile_id = ? AND game = ? AND faceit_nickname = ?",
      )
      .get(data.profile_id, data.game, data.faceit_nickname) as
      | GameConnectionRow
      | undefined;
  }

  if (existing) {
    db.prepare(
      `UPDATE game_connections
       SET account_name          = COALESCE(?, account_name),
           summoner_id           = COALESCE(?, summoner_id),
           riot_access_token     = COALESCE(?, riot_access_token),
           riot_refresh_token    = COALESCE(?, riot_refresh_token),
           riot_token_expires_at = COALESCE(?, riot_token_expires_at),
           faceit_player_id      = COALESCE(?, faceit_player_id),
           rank_tier             = ?,
           rank_division         = ?,
           lp_rr                 = ?,
           skill_level           = COALESCE(?, skill_level),
           region                = COALESCE(?, region),
           queue_type            = COALESCE(?, queue_type),
           last_refreshed_at     = unixepoch(),
           updated_at            = unixepoch()
       WHERE id = ?`,
    ).run(
      data.account_name ?? null,
      data.summoner_id ?? null,
      data.riot_access_token ?? null,
      data.riot_refresh_token ?? null,
      data.riot_token_expires_at ?? null,
      data.faceit_player_id ?? null,
      data.rank_tier ?? null,
      data.rank_division ?? null,
      data.lp_rr ?? null,
      data.skill_level ?? null,
      data.region ?? null,
      data.queue_type ?? null,
      existing.id,
    );
    return db
      .prepare("SELECT * FROM game_connections WHERE id = ?")
      .get(existing.id) as GameConnectionRow;
  }

  db.prepare(
    `INSERT INTO game_connections
       (id, profile_id, game, puuid, account_name, summoner_id,
        riot_access_token, riot_refresh_token, riot_token_expires_at,
        faceit_player_id, faceit_nickname,
        rank_tier, rank_division, lp_rr, skill_level, region, queue_type,
        last_refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
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
    data.region ?? null,
    data.queue_type ?? "RANKED_SOLO_5x5",
  );

  return db
    .prepare("SELECT * FROM game_connections WHERE id = ?")
    .get(data.id) as GameConnectionRow;
}

/** Update rank snapshot fields on an existing connection (for rank refresh). */
export function updateGameConnectionRank(
  id: string,
  data: {
    summoner_id?: string | null;
    rank_tier: string | null;
    rank_division: string | null;
    lp_rr: number | null;
  },
): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(
    `UPDATE game_connections
     SET rank_tier         = ?,
         rank_division     = ?,
         lp_rr             = ?,
         summoner_id       = COALESCE(?, summoner_id),
         last_refreshed_at = unixepoch(),
         updated_at        = unixepoch()
     WHERE id = ?`,
  ).run(data.rank_tier, data.rank_division, data.lp_rr, data.summoner_id ?? null, id);
}

export function findGameConnectionsByProfileId(profileId: string): GameConnectionRow[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM game_connections WHERE profile_id = ? ORDER BY created_at ASC",
    )
    .all(profileId) as GameConnectionRow[];
}

export function findVisibleGameConnectionsByProfileId(
  profileId: string,
): GameConnectionRow[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM game_connections WHERE profile_id = ? AND is_visible = 1 ORDER BY created_at ASC",
    )
    .all(profileId) as GameConnectionRow[];
}

/** Toggle visibility by connection ID. */
export function setGameConnectionVisibilityById(id: string, visible: boolean): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(
    "UPDATE game_connections SET is_visible = ?, updated_at = unixepoch() WHERE id = ?",
  ).run(visible ? 1 : 0, id);
}

/** Remove a specific connection by ID. */
export function deleteGameConnectionById(id: string): void {
  ensureMigrated();
  const db = getDb();
  db.prepare("DELETE FROM game_connections WHERE id = ?").run(id);
}

/** Remove all connections for a profile + game (used by legacy onboarding reset). */
export function deleteGameConnection(profileId: string, game: string): void {
  ensureMigrated();
  const db = getDb();
  db.prepare("DELETE FROM game_connections WHERE profile_id = ? AND game = ?").run(
    profileId,
    game,
  );
}

/** @deprecated Use setGameConnectionVisibilityById — kept for old routes. */
export function setGameConnectionVisibility(
  profileId: string,
  game: string,
  visible: boolean,
): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(
    "UPDATE game_connections SET is_visible = ?, updated_at = unixepoch() WHERE profile_id = ? AND game = ?",
  ).run(visible ? 1 : 0, profileId, game);
}
