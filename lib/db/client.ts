import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// ---------------------------------------------------------------------------
// Local SQLite database (better-sqlite3) for development
// In production this will be Cloudflare D1 via getCloudflareContext()
// ---------------------------------------------------------------------------

const DB_PATH = path.join(process.cwd(), ".wrangler", "state", "rankcard.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure directory exists
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  return _db;
}

/**
 * Run initial migrations against the local database.
 * Called once on first access.
 */
export function migrateLocal(): void {
  const db = getDb();
  const migrationsDir = path.join(process.cwd(), "migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // Simple migration tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  for (const file of files) {
    const applied = db
      .prepare("SELECT 1 FROM _migrations WHERE name = ?")
      .get(file);
    if (applied) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  }
}

// Auto-migrate on first import
let _migrated = false;
export function ensureMigrated(): void {
  if (_migrated) return;
  migrateLocal();
  _migrated = true;
}
