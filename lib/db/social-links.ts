import { getDb, ensureMigrated } from "./client";
import type { SocialLinkRow, SocialPlatform } from "@/types/db";

// ---------------------------------------------------------------------------
// Social link queries
// ---------------------------------------------------------------------------

export function upsertSocialLink(data: {
  id: string;
  profile_id: string;
  platform: SocialPlatform;
  handle_or_url: string;
  display_order?: number;
}): SocialLinkRow {
  ensureMigrated();
  const db = getDb();

  db.prepare(
    `INSERT INTO social_links (id, profile_id, platform, handle_or_url, display_order)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (profile_id, platform) DO UPDATE SET
       handle_or_url = excluded.handle_or_url,
       display_order = excluded.display_order`,
  ).run(
    data.id,
    data.profile_id,
    data.platform,
    data.handle_or_url,
    data.display_order ?? 0,
  );

  return db
    .prepare(
      "SELECT * FROM social_links WHERE profile_id = ? AND platform = ?",
    )
    .get(data.profile_id, data.platform) as SocialLinkRow;
}

export function findSocialLinksByProfileId(
  profileId: string,
): SocialLinkRow[] {
  ensureMigrated();
  const db = getDb();
  return db
    .prepare(
      "SELECT * FROM social_links WHERE profile_id = ? ORDER BY display_order",
    )
    .all(profileId) as SocialLinkRow[];
}

export function deleteSocialLink(
  profileId: string,
  platform: SocialPlatform,
): void {
  ensureMigrated();
  const db = getDb();
  db.prepare(
    "DELETE FROM social_links WHERE profile_id = ? AND platform = ?",
  ).run(profileId, platform);
}
