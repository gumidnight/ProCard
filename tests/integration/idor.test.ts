import crypto from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMigratedDb, seedProfile } from "../helpers/db";

// Back the data layer with a per-test in-memory SQLite DB.
const state = vi.hoisted(() => ({
  db: null as null | import("better-sqlite3").Database,
}));

vi.mock("@/lib/db/adapter", () => ({
  getDb: () => {
    const db = state.db!;
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
      async batch(stmts: Array<{ sql: string; params?: unknown[] }>) {
        return stmts.map((s) => {
          const r = db.prepare(s.sql).run(...(s.params ?? []));
          return { changes: r.changes };
        });
      },
    };
  },
}));

import {
  upsertGameConnection,
  deleteGameConnectionForProfile,
  setGameConnectionVisibilityForProfile,
  findGameConnectionsByProfileId,
  findVisibleGameConnectionsByProfileId,
} from "@/lib/db/game-connections";
import {
  upsertTeamHistory,
  deleteTeamHistoryEntryForProfile,
  findTeamHistoryByProfileId,
} from "@/lib/db/team-roles";

const A = { user: "user-a", profile: "profile-a" };
const B = { user: "user-b", profile: "profile-b" };

beforeEach(() => {
  state.db = createMigratedDb();
  seedProfile(state.db, A.user, A.profile, "alice");
  seedProfile(state.db, B.user, B.profile, "bob");
});

describe("IDOR — game connections", () => {
  it("a different profile cannot delete a connection it does not own", async () => {
    const conn = await upsertGameConnection({
      id: crypto.randomUUID(),
      profile_id: A.profile,
      game: "lol",
      puuid: "puuid-a",
      account_name: "Alice#EUW",
    });

    expect(await deleteGameConnectionForProfile(conn.id, B.profile)).toBe(false);
    expect(await findGameConnectionsByProfileId(A.profile)).toHaveLength(1);

    expect(await deleteGameConnectionForProfile(conn.id, A.profile)).toBe(true);
    expect(await findGameConnectionsByProfileId(A.profile)).toHaveLength(0);
  });

  it("a different profile cannot toggle visibility of a connection it does not own", async () => {
    const conn = await upsertGameConnection({
      id: crypto.randomUUID(),
      profile_id: A.profile,
      game: "lol",
      puuid: "puuid-a",
      account_name: "Alice#EUW",
    });

    expect(await setGameConnectionVisibilityForProfile(conn.id, B.profile, false)).toBe(
      false,
    );
    expect(await findVisibleGameConnectionsByProfileId(A.profile)).toHaveLength(1);

    expect(await setGameConnectionVisibilityForProfile(conn.id, A.profile, false)).toBe(
      true,
    );
    expect(await findVisibleGameConnectionsByProfileId(A.profile)).toHaveLength(0);
  });
});

describe("IDOR — team history", () => {
  it("a different profile cannot delete a team-history entry it does not own", async () => {
    const entry = await upsertTeamHistory({
      id: crypto.randomUUID(),
      profile_id: A.profile,
      org_name: "T1",
      game: "lol",
    });

    expect(await deleteTeamHistoryEntryForProfile(entry.id, B.profile)).toBe(false);
    expect(await findTeamHistoryByProfileId(A.profile)).toHaveLength(1);

    expect(await deleteTeamHistoryEntryForProfile(entry.id, A.profile)).toBe(true);
    expect(await findTeamHistoryByProfileId(A.profile)).toHaveLength(0);
  });

  it("upsert cannot overwrite another profile's entry via a supplied id (object injection)", async () => {
    const aEntry = await upsertTeamHistory({
      id: crypto.randomUUID(),
      profile_id: A.profile,
      org_name: "T1",
      game: "lol",
    });

    // Attacker B supplies A's entry id, attempting to overwrite it.
    const result = await upsertTeamHistory({
      id: aEntry.id,
      profile_id: B.profile,
      org_name: "HACKED",
      game: "lol",
    });

    // A's row is untouched...
    const aRows = await findTeamHistoryByProfileId(A.profile);
    expect(aRows).toHaveLength(1);
    expect(aRows[0].org_name).toBe("T1");

    // ...and B's write created a brand-new row with a fresh id, owned by B.
    expect(result.id).not.toBe(aEntry.id);
    expect(result.profile_id).toBe(B.profile);
    expect(await findTeamHistoryByProfileId(B.profile)).toHaveLength(1);
  });
});
