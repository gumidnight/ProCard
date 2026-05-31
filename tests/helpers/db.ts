import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

/**
 * Build a fresh in-memory SQLite DB with all migrations applied.
 * Mirrors the local-dev migration runner (lib/db/client.ts) but isolated per test.
 */
export function createMigratedDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  const dir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    db.exec(fs.readFileSync(path.join(dir, file), "utf-8"));
  }
  return db;
}

/** Insert a minimal user + profile pair so child-table FKs are satisfied. */
export function seedProfile(
  db: Database.Database,
  userId: string,
  profileId: string,
  slug: string,
): void {
  db.prepare(
    "INSERT INTO users (id, discord_id, username, access_token) VALUES (?, ?, ?, ?)",
  ).run(userId, `discord-${userId}`, `user-${userId}`, "token");
  db.prepare(
    "INSERT INTO profiles (id, user_id, slug, display_name) VALUES (?, ?, ?, ?)",
  ).run(profileId, userId, slug, `Player ${slug}`);
}
