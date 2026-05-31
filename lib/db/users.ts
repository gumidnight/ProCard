import { getDb } from "./adapter";
import type { UserRow } from "@/types/db";

// ---------------------------------------------------------------------------
// User queries
// ---------------------------------------------------------------------------

export async function upsertUser(data: {
  id: string;
  discord_id: string;
  username: string;
  discriminator: string;
  avatar_url: string | null;
  email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: number | null;
}): Promise<UserRow> {
  const db = getDb();

  const existing = await db.first<UserRow>("SELECT * FROM users WHERE discord_id = ?", [
    data.discord_id,
  ]);

  if (existing) {
    await db.run(
      `UPDATE users
       SET username = ?, discriminator = ?, avatar_url = ?,
           email = ?, access_token = ?, refresh_token = ?,
           token_expires_at = ?, updated_at = unixepoch()
       WHERE discord_id = ?`,
      [
        data.username,
        data.discriminator,
        data.avatar_url,
        data.email,
        data.access_token,
        data.refresh_token,
        data.token_expires_at,
        data.discord_id,
      ],
    );
    return (await db.first<UserRow>("SELECT * FROM users WHERE discord_id = ?", [
      data.discord_id,
    ]))!;
  }

  await db.run(
    `INSERT INTO users (id, discord_id, username, discriminator, avatar_url, email, access_token, refresh_token, token_expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.discord_id,
      data.username,
      data.discriminator,
      data.avatar_url,
      data.email,
      data.access_token,
      data.refresh_token,
      data.token_expires_at,
    ],
  );

  return (await db.first<UserRow>("SELECT * FROM users WHERE id = ?", [data.id]))!;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  return getDb().first<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
}

export async function findUserByDiscordId(discordId: string): Promise<UserRow | null> {
  return getDb().first<UserRow>("SELECT * FROM users WHERE discord_id = ?", [discordId]);
}

export async function deleteUser(id: string): Promise<void> {
  await getDb().run("DELETE FROM users WHERE id = ?", [id]);
}
