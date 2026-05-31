import { getDb } from "./adapter";
import type { ProfileRow } from "@/types/db";

// ---------------------------------------------------------------------------
// Allowed column names for updateProfile. Listed here rather than in the
// route so the helper is safe regardless of caller (prevents column-name
// injection if a future caller accidentally passes user-supplied keys).
// ---------------------------------------------------------------------------
const UPDATEABLE_COLUMNS = new Set([
  "slug",
  "display_name",
  "country",
  "tagline",
  "bio",
  "avatar_key",
  "banner_key",
  "background_key",
  "background_type",
  "background_preset",
  "status",
  "status_note",
  "esports_role",
  "current_team_name",
  "current_team_logo_url",
  "current_league",
  "current_role",
  "current_game",
  "is_verified",
  "is_pro",
  "is_published",
  "published_at",
]);

// ---------------------------------------------------------------------------
// Profile queries
// ---------------------------------------------------------------------------

export async function createProfile(data: {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  country?: string | null;
  tagline?: string | null;
  bio?: string | null;
  status?: ProfileRow["status"];
}): Promise<ProfileRow> {
  const db = getDb();
  await db.run(
    `INSERT INTO profiles (id, user_id, slug, display_name, country, tagline, bio, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.user_id,
      data.slug,
      data.display_name,
      data.country ?? null,
      data.tagline ?? null,
      data.bio ?? null,
      data.status ?? "not_looking",
    ],
  );
  return (await db.first<ProfileRow>("SELECT * FROM profiles WHERE id = ?", [data.id]))!;
}

export async function findProfileByUserId(userId: string): Promise<ProfileRow | null> {
  return getDb().first<ProfileRow>("SELECT * FROM profiles WHERE user_id = ?", [userId]);
}

export async function findProfileBySlug(slug: string): Promise<ProfileRow | null> {
  return getDb().first<ProfileRow>(
    "SELECT * FROM profiles WHERE slug = ? AND is_published = 1",
    [slug],
  );
}

export async function findProfileBySlugAny(slug: string): Promise<ProfileRow | null> {
  return getDb().first<ProfileRow>("SELECT * FROM profiles WHERE slug = ?", [slug]);
}

export async function updateProfile(
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
      | "banner_key"
      | "background_key"
      | "background_type"
      | "background_preset"
      | "status"
      | "status_note"
      | "esports_role"
      | "current_team_name"
      | "current_team_logo_url"
      | "current_league"
      | "current_role"
      | "current_game"
      | "is_verified"
      | "is_pro"
      | "is_published"
      | "published_at"
    >
  >,
): Promise<ProfileRow | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (!UPDATEABLE_COLUMNS.has(key)) continue; // internal allow-list
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return findProfileByIdInternal(id);

  fields.push("updated_at = unixepoch()");
  values.push(id);

  await getDb().run(`UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`, values);
  return findProfileByIdInternal(id);
}

async function findProfileByIdInternal(id: string): Promise<ProfileRow | null> {
  return getDb().first<ProfileRow>("SELECT * FROM profiles WHERE id = ?", [id]);
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  const row = await getDb().first("SELECT 1 FROM profiles WHERE slug = ?", [slug]);
  return !row;
}
