import { getDb } from "./adapter";
import type { SocialLinkRow, SocialPlatform } from "@/types/db";

// ---------------------------------------------------------------------------
// Social link queries
// ---------------------------------------------------------------------------

export async function upsertSocialLink(data: {
  id: string;
  profile_id: string;
  platform: SocialPlatform;
  handle_or_url: string;
  display_order?: number;
}): Promise<SocialLinkRow> {
  const db = getDb();

  await db.run(
    `INSERT INTO social_links (id, profile_id, platform, handle_or_url, display_order)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (profile_id, platform) DO UPDATE SET
       handle_or_url = excluded.handle_or_url,
       display_order = excluded.display_order`,
    [
      data.id,
      data.profile_id,
      data.platform,
      data.handle_or_url,
      data.display_order ?? 0,
    ],
  );

  return (await db.first<SocialLinkRow>(
    "SELECT * FROM social_links WHERE profile_id = ? AND platform = ?",
    [data.profile_id, data.platform],
  ))!;
}

export async function findSocialLinksByProfileId(
  profileId: string,
): Promise<SocialLinkRow[]> {
  return getDb().all<SocialLinkRow>(
    "SELECT * FROM social_links WHERE profile_id = ? ORDER BY display_order",
    [profileId],
  );
}

export async function deleteSocialLink(
  profileId: string,
  platform: SocialPlatform,
): Promise<void> {
  await getDb().run("DELETE FROM social_links WHERE profile_id = ? AND platform = ?", [
    profileId,
    platform,
  ]);
}
