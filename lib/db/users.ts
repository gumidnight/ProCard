import { getDb, ensureMigrated } from "./client";
import type { UserRow } from "@/types/db";

// ---------------------------------------------------------------------------
// User queries
// ---------------------------------------------------------------------------

export function upsertUser(data: {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar_url: string | null;
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: number | null;
}): UserRow {
  ensureMigrated();
  const db = getDb();

  const existing = db
    .prepare("SELECT * FROM users WHERE discord_id = ?")
    .get(data.discord_id) as UserRow | undefined;

  if (existing) {
    db.prepare(
      `UPDATE users
       SET username = ?, discriminator = ?, avatar_url = ?,
           email = ?, access_token = ?, refresh_token = ?,
           token_expires_at = ?, updated_at = unixepoch()
       WHERE discord_id = ?`,
    ).run(
      data.username,
      data.discriminator,
      data.avatar_url,
      data.email,
      data.access_token,
      data.refresh_token,
      data.token_expires_at,
      data.discord_id,
    );
    return db
      .prepare("SELECT * FROM users WHERE discord_id = ?")
      .get(data.discord_id) as UserRow;
  }

  db.prepare(
    `INSERT INTO users (id, discord_id, username, discriminator, avatar_url, email, access_token, refresh_token, token_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    data.id,
    data.discord_id,
    data.username,
    data.discriminator,
    data.avatar_url,
    data.email,
    data.access_token,
    data.refresh_token,
    data.token_expires_at,
  );

  return db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(data.id) as UserRow;
}

export function findUserById(id: string): UserRow | null {
  ensureMigrated();
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
      | UserRow
      | undefined) ?? null
  );
}

export function findUserByDiscordId(discordId: string): UserRow | null {
  ensureMigrated();
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM users WHERE discord_id = ?")
      .get(discordId) as UserRow | undefined) ?? null
  );
}

export function deleteUser(id: string): void {
  ensureMigrated();
  const db = getDb();
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
}
