import { getDb, ensureMigrated } from "./client";
import type { ProfileRow } from "@/types/db";

// ---------------------------------------------------------------------------
// Profile queries
// ---------------------------------------------------------------------------

export function createProfile(data: {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  country?: string | null;
  tagline?: string | null;
  bio?: string | null;
  status?: ProfileRow["status"];
}): ProfileRow {
  ensureMigrated();
  const db = getDb();
  db.prepare(
    `INSERT INTO profiles (id, user_id, slug, display_name, country, tagline, bio, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    data.id,
    data.user_id,
    data.slug,
    data.display_name,
    data.country ?? null,
    data.tagline ?? null,
    data.bio ?? null,
    data.status ?? "not_looking",
  );
  return db.prepare("SELECT * FROM profiles WHERE id = ?").get(data.id) as ProfileRow;
}

export function findProfileByUserId(userId: string): ProfileRow | null {
  ensureMigrated();
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId) as
      | ProfileRow
      | undefined) ?? null
  );
}

export function findProfileBySlug(slug: string): ProfileRow | null {
  ensureMigrated();
  const db = getDb();
  return (
    (db
      .prepare("SELECT * FROM profiles WHERE slug = ? AND is_published = 1")
      .get(slug) as ProfileRow | undefined) ?? null
  );
}

export function findProfileBySlugAny(slug: string): ProfileRow | null {
  ensureMigrated();
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM profiles WHERE slug = ?").get(slug) as
      | ProfileRow
      | undefined) ?? null
  );
}

export function updateProfile(
  id: string,
  data: Partial<
    Pick<
      ProfileRow,
      | "slug"
      | "display_name"
      | "country"
      | "tagline"
      | "bio"
      | "avatar_key"
      | "status"
      | "status_note"
      | "current_team_name"
      | "current_team_logo_url"
      | "current_league"
      | "current_role"
      | "current_game"
      | "esports_role"
      | "banner_key"
      | "background_type"
      | "background_preset"
      | "background_key"
      | "is_verified"
      | "is_pro"
      | "is_published"
      | "published_at"
    >
  >,
): ProfileRow | null {
  ensureMigrated();
  const db = getDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return findProfileByIdInternal(id);

  fields.push("updated_at = unixepoch()");
  values.push(id);

  db.prepare(`UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return findProfileByIdInternal(id);
}

function findProfileByIdInternal(id: string): ProfileRow | null {
  const db = getDb();
  return (
    (db.prepare("SELECT * FROM profiles WHERE id = ?").get(id) as
      | ProfileRow
      | undefined) ?? null
  );
}

export function isSlugAvailable(slug: string): boolean {
  ensureMigrated();
  const db = getDb();
  const row = db.prepare("SELECT 1 FROM profiles WHERE slug = ?").get(slug);
  return !row;
}
