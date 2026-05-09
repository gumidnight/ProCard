import { getDb, ensureMigrated } from "./client";
import type { TeamHistoryRow, RolePlayedRow } from "@/types/db";

// ---------------------------------------------------------------------------
// Team history queries
// ---------------------------------------------------------------------------

export function upsertTeamHistory(data: {
  id: string;
  profile_id: string;
  org_name: string;
  role?: string | null;
  game: string;
  start_date?: string | null;
  end_date?: string | null;
  result_note?: string | null;
  display_order?: number;
}): TeamHistoryRow {
  ensureMigrated();
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM team_history WHERE id = ?")
    .get(data.id) as TeamHistoryRow | undefined;

  if (existing) {
    db.prepare(
      `UPDATE team_history
       SET org_name = ?, role = ?, game = ?, start_date = ?,
           end_date = ?, result_note = ?, display_order = ?
       WHERE id = ?`,
    ).run(
      data.org_name,
      data.role ?? null,
      data.game,
      data.start_date ?? null,
      data.end_date ?? null,
      data.result_note ?? null,
      data.display_order ?? 0,
      data.id,
    );
    return db
      .prepare("SELECT * FROM team_history WHERE id = ?")
      .get(data.id) as TeamHistoryRow;
  }

  db.prepare(
    `INSERT INTO team_history (id, profile_id, org_name, role, game, start_date, end_date, result_note, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    data.id,
    data.profile_id,
    data.org_name,
    data.role ?? null,
    data.game,
    data.start_date ?? null,
    data.end_date ?? null,
    data.result_note ?? null,
    data.display_order ?? 0,
  );

  return db
    .prepare("SELECT * FROM team_history WHERE id = ?")
    .get(data.id) as TeamHistoryRow;
}

export function findTeamHistoryByProfileId(
  profileId: string,
): TeamHistoryRow[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM team_history WHERE profile_id = ? ORDER BY display_order",
    )
    .all(profileId) as TeamHistoryRow[];
}

export function deleteTeamHistoryEntry(id: string): void {
  ensureMigrated();
  const db = getDb();
  db.prepare("DELETE FROM team_history WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Roles played queries
// ---------------------------------------------------------------------------

export function upsertRolePlayed(data: {
  id: string;
  profile_id: string;
  game: string;
  role: string;
  is_main?: number;
  display_order?: number;
}): RolePlayedRow {
  ensureMigrated();
  const db = getDb();

  db.prepare(
    `INSERT INTO roles_played (id, profile_id, game, role, is_main, display_order)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (profile_id, game, role) DO UPDATE SET
       is_main = excluded.is_main,
       display_order = excluded.display_order`,
  ).run(
    data.id,
    data.profile_id,
    data.game,
    data.role,
    data.is_main ?? 0,
    data.display_order ?? 0,
  );

  return db
    .prepare(
      "SELECT * FROM roles_played WHERE profile_id = ? AND game = ? AND role = ?",
    )
    .get(data.profile_id, data.game, data.role) as RolePlayedRow;
}

export function findRolesPlayedByProfileId(
  profileId: string,
): RolePlayedRow[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM roles_played WHERE profile_id = ? ORDER BY display_order",
    )
    .all(profileId) as RolePlayedRow[];
}

export function deleteRolesPlayedByProfile(profileId: string): void {
  ensureMigrated();
  const db = getDb();
  db.prepare("DELETE FROM roles_played WHERE profile_id = ?").run(profileId);
}
