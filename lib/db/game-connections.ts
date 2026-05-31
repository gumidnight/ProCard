import { getDb } from "./adapter";
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
export async function upsertGameConnection(data: {
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
}): Promise<GameConnectionRow> {
  const db = getDb();

  // Find existing by the natural deduplication key (puuid or faceit_nickname)
  let existing: GameConnectionRow | null = null;
  if (data.puuid) {
    existing = await db.first<GameConnectionRow>(
      "SELECT * FROM game_connections WHERE profile_id = ? AND game = ? AND puuid = ?",
      [data.profile_id, data.game, data.puuid],
    );
  } else if (data.faceit_nickname) {
    existing = await db.first<GameConnectionRow>(
      "SELECT * FROM game_connections WHERE profile_id = ? AND game = ? AND faceit_nickname = ?",
      [data.profile_id, data.game, data.faceit_nickname],
    );
  }

  if (existing) {
    await db.run(
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
      [
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
      ],
    );
    return (await db.first<GameConnectionRow>(
      "SELECT * FROM game_connections WHERE id = ?",
      [existing.id],
    ))!;
  }

  await db.run(
    `INSERT INTO game_connections
       (id, profile_id, game, puuid, account_name, summoner_id,
        riot_access_token, riot_refresh_token, riot_token_expires_at,
        faceit_player_id, faceit_nickname,
        rank_tier, rank_division, lp_rr, skill_level, region, queue_type,
        last_refreshed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())`,
    [
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
    ],
  );

  return (await db.first<GameConnectionRow>(
    "SELECT * FROM game_connections WHERE id = ?",
    [data.id],
  ))!;
}

/** Update rank snapshot fields on an existing connection (for rank refresh). */
export async function updateGameConnectionRank(
  id: string,
  data: {
    summoner_id?: string | null;
    rank_tier: string | null;
    rank_division: string | null;
    lp_rr: number | null;
  },
): Promise<void> {
  await getDb().run(
    `UPDATE game_connections
     SET rank_tier         = ?,
         rank_division     = ?,
         lp_rr             = ?,
         summoner_id       = COALESCE(?, summoner_id),
         last_refreshed_at = unixepoch(),
         updated_at        = unixepoch()
     WHERE id = ?`,
    [data.rank_tier, data.rank_division, data.lp_rr, data.summoner_id ?? null, id],
  );
}

export async function findGameConnectionsByProfileId(
  profileId: string,
): Promise<GameConnectionRow[]> {
  return getDb().all<GameConnectionRow>(
    "SELECT * FROM game_connections WHERE profile_id = ? ORDER BY created_at ASC",
    [profileId],
  );
}

export async function findVisibleGameConnectionsByProfileId(
  profileId: string,
): Promise<GameConnectionRow[]> {
  return getDb().all<GameConnectionRow>(
    "SELECT * FROM game_connections WHERE profile_id = ? AND is_visible = 1 ORDER BY created_at ASC",
    [profileId],
  );
}

// ---------------------------------------------------------------------------
// IDOR-safe profile-scoped mutations (Phase 0)
// These functions scope writes to the caller's own profile_id, preventing
// one user from modifying another user's game connections.
// ---------------------------------------------------------------------------

/**
 * Toggle visibility of a connection the caller owns.
 * Returns true if a row was updated (exists AND belongs to the profile).
 */
export async function setGameConnectionVisibilityForProfile(
  id: string,
  profileId: string,
  visible: boolean,
): Promise<boolean> {
  const res = await getDb().run(
    "UPDATE game_connections SET is_visible = ?, updated_at = unixepoch() WHERE id = ? AND profile_id = ?",
    [visible ? 1 : 0, id, profileId],
  );
  return res.changes > 0;
}

/**
 * Remove a connection the caller owns.
 * Returns true if a row was deleted.
 */
export async function deleteGameConnectionForProfile(
  id: string,
  profileId: string,
): Promise<boolean> {
  const res = await getDb().run(
    "DELETE FROM game_connections WHERE id = ? AND profile_id = ?",
    [id, profileId],
  );
  return res.changes > 0;
}

/** Remove all connections for a profile + game (used by legacy onboarding reset). */
export async function deleteGameConnection(
  profileId: string,
  game: string,
): Promise<void> {
  await getDb().run("DELETE FROM game_connections WHERE profile_id = ? AND game = ?", [
    profileId,
    game,
  ]);
}
