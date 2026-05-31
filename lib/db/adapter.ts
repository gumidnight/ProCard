// lib/db/adapter.ts
import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// Minimal structural interface for D1 — avoids needing @cloudflare/workers-types
interface D1LikeStmt {
  bind(...values: unknown[]): {
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{ results: T[] }>;
    run(): Promise<{ meta: { changes: number } }>;
  };
}
interface D1LikeDb {
  prepare(sql: string): D1LikeStmt;
  batch<T = unknown>(
    stmts: unknown[],
  ): Promise<Array<{ results: T[]; meta: { changes: number } }>>;
}

export interface DbAdapter {
  first<T = unknown>(sql: string, params?: unknown[]): Promise<T | null>;
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
  batch(
    stmts: Array<{ sql: string; params?: unknown[] }>,
  ): Promise<Array<{ results?: unknown[]; changes?: number }>>;
}

// ── D1 adapter (production) ──────────────────────────────────────────────────
function createD1Adapter(db: D1LikeDb): DbAdapter {
  return {
    async first<T>(sql: string, params: unknown[] = []) {
      return db
        .prepare(sql)
        .bind(...params)
        .first<T>();
    },
    async all<T>(sql: string, params: unknown[] = []) {
      const r = await db
        .prepare(sql)
        .bind(...params)
        .all<T>();
      return r.results;
    },
    async run(sql: string, params: unknown[] = []) {
      const r = await db
        .prepare(sql)
        .bind(...params)
        .run();
      return { changes: r.meta.changes ?? 0 };
    },
    async batch(stmts) {
      const prepared = stmts.map((s) => db.prepare(s.sql).bind(...(s.params ?? [])));
      const results = await db.batch(prepared);
      return results.map((r) => ({ results: r.results, changes: r.meta.changes }));
    },
  };
}

// ── SQLite adapter (local dev & tests) ──────────────────────────────────────
let _sqliteDb: Database.Database | null = null;

function getLocalSqliteDb(): Database.Database {
  if (_sqliteDb) return _sqliteDb;
  const dbPath = path.join(process.cwd(), ".wrangler", "state", "procard.db");
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _sqliteDb = new Database(dbPath);
  _sqliteDb.pragma("journal_mode = WAL");
  _sqliteDb.pragma("foreign_keys = ON");
  return _sqliteDb;
}

function createSqliteAdapter(db: Database.Database): DbAdapter {
  return {
    async first<T>(sql: string, params: unknown[] = []) {
      return (db.prepare(sql).get(...params) as T) ?? null;
    },
    async all<T>(sql: string, params: unknown[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async run(sql: string, params: unknown[] = []) {
      const r = db.prepare(sql).run(...params);
      return { changes: r.changes };
    },
    async batch(stmts) {
      return stmts.map((s) => {
        const r = db.prepare(s.sql).run(...(s.params ?? []));
        return { changes: r.changes };
      });
    },
  };
}

// ── Public factory ───────────────────────────────────────────────────────────
// Called inside every DB helper. Tries CF context first; falls back to SQLite.
export function getDb(): DbAdapter {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext() as { env: Record<string, unknown> };
    if (env.DB) return createD1Adapter(env.DB as D1LikeDb);
  } catch {
    // Not in a CF request context — use local SQLite (dev/tests)
  }
  return createSqliteAdapter(getLocalSqliteDb());
}
