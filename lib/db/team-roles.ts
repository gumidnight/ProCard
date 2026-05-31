import crypto from "node:crypto";
import { getDb } from "./adapter";
import type { TeamHistoryRow, RolePlayedRow } from "@/types/db";

// ---------------------------------------------------------------------------
// Team history queries
// ---------------------------------------------------------------------------

export async function upsertTeamHistory(data: {
  id: string;
  profile_id: string;
  org_name: string;
  tournament_name?: string | null;
  org_logo_url?: string | null;
  role?: string | null;
  game: string;
  start_date?: string | null;
  end_date?: string | null;
  result_note?: string | null;
  display_order?: number;
}): Promise<TeamHistoryRow> {
  const db = getDb();

  // Scope the existence check to (id, profile_id) to prevent IDOR:
  // a client-supplied id belonging to another profile won't match.
  const existing = await db.first<TeamHistoryRow>(
    "SELECT * FROM team_history WHERE id = ? AND profile_id = ?",
    [data.id, data.profile_id],
  );

  if (existing) {
    await db.run(
      `UPDATE team_history
       SET org_name = ?, tournament_name = ?, org_logo_url = ?, role = ?,
           game = ?, start_date = ?, end_date = ?, result_note = ?,
           display_order = ?
       WHERE id = ? AND profile_id = ?`,
      [
        data.org_name,
        data.tournament_name ?? null,
        data.org_logo_url ?? null,
        data.role ?? null,
        data.game,
        data.start_date ?? null,
        data.end_date ?? null,
        data.result_note ?? null,
        data.display_order ?? 0,
        data.id,
        data.profile_id,
      ],
    );
    return (await db.first<TeamHistoryRow>(
      "SELECT * FROM team_history WHERE id = ? AND profile_id = ?",
      [data.id, data.profile_id],
    ))!;
  }

  // Always mint a server-side id for inserts so a client cannot hijack/collide
  // with an id belonging to another profile (object-injection prevention).
  const newId = crypto.randomUUID();
  await db.run(
    `INSERT INTO team_history (id, profile_id, org_name, tournament_name, org_logo_url, role, game, start_date, end_date, result_note, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId,
      data.profile_id,
      data.org_name,
      data.tournament_name ?? null,
      data.org_logo_url ?? null,
      data.role ?? null,
      data.game,
      data.start_date ?? null,
      data.end_date ?? null,
      data.result_note ?? null,
      data.display_order ?? 0,
    ],
  );

  return (await db.first<TeamHistoryRow>("SELECT * FROM team_history WHERE id = ?", [
    newId,
  ]))!;
}

export async function findTeamHistoryByProfileId(
  profileId: string,
): Promise<TeamHistoryRow[]> {
  return getDb().all<TeamHistoryRow>(
    "SELECT * FROM team_history WHERE profile_id = ? ORDER BY display_order",
    [profileId],
  );
}

/**
 * Delete a team-history entry the caller owns.
 * Scoped by profile_id to prevent IDOR. Returns true if a row was deleted.
 */
export async function deleteTeamHistoryEntryForProfile(
  id: string,
  profileId: string,
): Promise<boolean> {
  const res = await getDb().run(
    "DELETE FROM team_history WHERE id = ? AND profile_id = ?",
    [id, profileId],
  );
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// Roles played queries
// ---------------------------------------------------------------------------

export async function upsertRolePlayed(data: {
  id: string;
  profile_id: string;
  game: string;
  role: string;
  is_main?: number;
  display_order?: number;
}): Promise<RolePlayedRow> {
  const db = getDb();

  await db.run(
    `INSERT INTO roles_played (id, profile_id, game, role, is_main, display_order)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (profile_id, game, role) DO UPDATE SET
       is_main = excluded.is_main,
       display_order = excluded.display_order`,
    [
      data.id,
      data.profile_id,
      data.game,
      data.role,
      data.is_main ?? 0,
      data.display_order ?? 0,
    ],
  );

  return (await db.first<RolePlayedRow>(
    "SELECT * FROM roles_played WHERE profile_id = ? AND game = ? AND role = ?",
    [data.profile_id, data.game, data.role],
  ))!;
}

export async function findRolesPlayedByProfileId(
  profileId: string,
): Promise<RolePlayedRow[]> {
  return getDb().all<RolePlayedRow>(
    "SELECT * FROM roles_played WHERE profile_id = ? ORDER BY display_order",
    [profileId],
  );
}

export async function deleteRolesPlayedByProfile(profileId: string): Promise<void> {
  await getDb().run("DELETE FROM roles_played WHERE profile_id = ?", [profileId]);
}
