import { getDb } from "./adapter";
import type { ProfileCommentRow, ProfileCommentWithAuthor } from "@/types/db";

// ---------------------------------------------------------------------------
// Views (anonymous, deduped per visitor_id)
// ---------------------------------------------------------------------------

export async function countProfileViews(profileId: string): Promise<number> {
  const row = await getDb().first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM profile_views WHERE profile_id = ?",
    [profileId],
  );
  return row?.n ?? 0;
}

/** Insert a (profile, visitor) view row, ignoring duplicates. Returns true if newly inserted. */
export async function recordProfileView(
  profileId: string,
  visitorId: string,
): Promise<boolean> {
  const res = await getDb().run(
    `INSERT OR IGNORE INTO profile_views (id, profile_id, visitor_id)
     VALUES (?, ?, ?)`,
    [crypto.randomUUID(), profileId, visitorId],
  );
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// Likes (anonymous toggle)
// ---------------------------------------------------------------------------

export async function countProfileLikes(profileId: string): Promise<number> {
  const row = await getDb().first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM profile_likes WHERE profile_id = ?",
    [profileId],
  );
  return row?.n ?? 0;
}

export async function hasVisitorLiked(
  profileId: string,
  visitorId: string,
): Promise<boolean> {
  const row = await getDb().first<{ x: number }>(
    "SELECT 1 AS x FROM profile_likes WHERE profile_id = ? AND visitor_id = ?",
    [profileId, visitorId],
  );
  return !!row;
}

/** Toggles a like for the visitor. Returns the new liked state. */
export async function toggleProfileLike(
  profileId: string,
  visitorId: string,
): Promise<{ liked: boolean; total: number }> {
  const db = getDb();
  const existing = await db.first<{ id: string }>(
    "SELECT id FROM profile_likes WHERE profile_id = ? AND visitor_id = ?",
    [profileId, visitorId],
  );

  if (existing) {
    await db.run("DELETE FROM profile_likes WHERE id = ?", [existing.id]);
  } else {
    await db.run(
      `INSERT INTO profile_likes (id, profile_id, visitor_id) VALUES (?, ?, ?)`,
      [crypto.randomUUID(), profileId, visitorId],
    );
  }

  return { liked: !existing, total: await countProfileLikes(profileId) };
}

// ---------------------------------------------------------------------------
// Comments (require login)
// ---------------------------------------------------------------------------

export async function findCommentsByProfileId(
  profileId: string,
): Promise<ProfileCommentWithAuthor[]> {
  return getDb().all<ProfileCommentWithAuthor>(
    `SELECT
       c.id, c.profile_id, c.user_id, c.body, c.created_at,
       u.username       AS author_username,
       u.avatar_url     AS author_avatar_url,
       p.slug           AS author_slug
     FROM profile_comments c
     JOIN users    u ON u.id = c.user_id
     LEFT JOIN profiles p ON p.user_id = u.id
     WHERE c.profile_id = ?
     ORDER BY c.created_at DESC`,
    [profileId],
  );
}

export async function countCommentsByProfileId(profileId: string): Promise<number> {
  const row = await getDb().first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM profile_comments WHERE profile_id = ?",
    [profileId],
  );
  return row?.n ?? 0;
}

export async function createComment(args: {
  profile_id: string;
  user_id: string;
  body: string;
}): Promise<ProfileCommentRow> {
  const db = getDb();
  const id = crypto.randomUUID();
  await db.run(
    `INSERT INTO profile_comments (id, profile_id, user_id, body) VALUES (?, ?, ?, ?)`,
    [id, args.profile_id, args.user_id, args.body],
  );
  return (await db.first<ProfileCommentRow>(
    "SELECT * FROM profile_comments WHERE id = ?",
    [id],
  ))!;
}

export async function findCommentById(id: string): Promise<ProfileCommentRow | null> {
  return getDb().first<ProfileCommentRow>("SELECT * FROM profile_comments WHERE id = ?", [
    id,
  ]);
}

export async function deleteCommentById(id: string): Promise<void> {
  await getDb().run("DELETE FROM profile_comments WHERE id = ?", [id]);
}

// ---------------------------------------------------------------------------
// Social link clicks (raw outbound-click counter, per platform)
// ---------------------------------------------------------------------------

export async function recordSocialClick(args: {
  profile_id: string;
  social_link_id: string;
  platform: string;
}): Promise<void> {
  await getDb().run(
    `INSERT INTO social_link_clicks (id, profile_id, social_link_id, platform)
     VALUES (?, ?, ?, ?)`,
    [crypto.randomUUID(), args.profile_id, args.social_link_id, args.platform],
  );
}

export async function countSocialClicksByProfileId(profileId: string): Promise<number> {
  const row = await getDb().first<{ n: number }>(
    "SELECT COUNT(*) AS n FROM social_link_clicks WHERE profile_id = ?",
    [profileId],
  );
  return row?.n ?? 0;
}

export async function countSocialClicksByPlatform(
  profileId: string,
): Promise<{ platform: string; clicks: number }[]> {
  return getDb().all<{ platform: string; clicks: number }>(
    `SELECT platform, COUNT(*) AS clicks
     FROM social_link_clicks
     WHERE profile_id = ?
     GROUP BY platform
     ORDER BY clicks DESC`,
    [profileId],
  );
}

// ---------------------------------------------------------------------------
// View events (per-view stream: recent activity, geography, live counts)
// ---------------------------------------------------------------------------

const VIEW_EVENT_DEDUP_WINDOW = 1800; // 30 min

export async function recordViewEvent(args: {
  profile_id: string;
  visitor_id: string;
  viewer_user_id?: string | null;
  referrer?: string | null;
  country?: string | null;
}): Promise<boolean> {
  const db = getDb();
  const recent = await db.first<{ x: number }>(
    `SELECT 1 AS x FROM profile_view_events
     WHERE profile_id = ? AND visitor_id = ?
       AND created_at > unixepoch() - ?`,
    [args.profile_id, args.visitor_id, VIEW_EVENT_DEDUP_WINDOW],
  );
  if (recent) return false;

  await db.run(
    `INSERT INTO profile_view_events
       (id, profile_id, visitor_id, viewer_user_id, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      args.profile_id,
      args.visitor_id,
      args.viewer_user_id ?? null,
      args.referrer ?? null,
      args.country ?? null,
    ],
  );
  return true;
}

export async function countViewEventsSince(
  profileId: string,
  sinceTs: number,
): Promise<number> {
  const row = await getDb().first<{ n: number }>(
    `SELECT COUNT(*) AS n FROM profile_view_events
     WHERE profile_id = ? AND created_at >= ?`,
    [profileId, sinceTs],
  );
  return row?.n ?? 0;
}

export async function countViewsByCountry(
  profileId: string,
): Promise<{ country: string; views: number }[]> {
  return getDb().all<{ country: string; views: number }>(
    `SELECT country, COUNT(*) AS views
     FROM profile_view_events
     WHERE profile_id = ? AND country IS NOT NULL AND country <> ''
     GROUP BY country
     ORDER BY views DESC`,
    [profileId],
  );
}

export async function countViewersByRole(
  profileId: string,
): Promise<{ role: string; viewers: number }[]> {
  const rows = await getDb().all<{ user_id: string; roles: string | null }>(
    `SELECT DISTINCT e.viewer_user_id AS user_id, p.esports_role AS roles
     FROM profile_view_events e
     JOIN profiles p ON p.user_id = e.viewer_user_id
     WHERE e.profile_id = ? AND e.viewer_user_id IS NOT NULL`,
    [profileId],
  );

  const counts = new Map<string, number>();
  for (const r of rows) {
    const role = (r.roles?.split(",")[0] ?? "player").trim() || "player";
    counts.set(role, (counts.get(role) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([role, viewers]) => ({ role, viewers }))
    .sort((a, b) => b.viewers - a.viewers);
}

// ---------------------------------------------------------------------------
// Recent activity feed
// ---------------------------------------------------------------------------

export type ActivityKind = "view" | "like" | "comment" | "click";

export interface ActivityItem {
  kind: ActivityKind;
  created_at: number;
  country?: string | null;
  viewerRole?: string | null;
  platform?: string | null;
}

export async function findRecentActivity(
  profileId: string,
  limit = 12,
): Promise<ActivityItem[]> {
  const db = getDb();

  const [views, likes, comments, clicks] = await Promise.all([
    db.all<{ created_at: number; country: string | null; roles: string | null }>(
      `SELECT e.created_at, e.country, p.esports_role AS roles
       FROM profile_view_events e
       LEFT JOIN profiles p ON p.user_id = e.viewer_user_id
       WHERE e.profile_id = ?
       ORDER BY e.created_at DESC LIMIT ?`,
      [profileId, limit],
    ),
    db.all<{ created_at: number }>(
      `SELECT created_at FROM profile_likes WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?`,
      [profileId, limit],
    ),
    db.all<{ created_at: number }>(
      `SELECT created_at FROM profile_comments WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?`,
      [profileId, limit],
    ),
    db.all<{ created_at: number; platform: string }>(
      `SELECT created_at, platform FROM social_link_clicks WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?`,
      [profileId, limit],
    ),
  ]);

  const items: ActivityItem[] = [
    ...views.map((v) => ({
      kind: "view" as const,
      created_at: v.created_at,
      country: v.country,
      viewerRole: v.roles ? v.roles.split(",")[0].trim() || null : null,
    })),
    ...likes.map((l) => ({ kind: "like" as const, created_at: l.created_at })),
    ...comments.map((c) => ({ kind: "comment" as const, created_at: c.created_at })),
    ...clicks.map((c) => ({
      kind: "click" as const,
      created_at: c.created_at,
      platform: c.platform,
    })),
  ];

  return items.sort((a, b) => b.created_at - a.created_at).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Aggregated analytics for the owner dashboard
// ---------------------------------------------------------------------------

export interface ProfileAnalytics {
  views: number;
  likes: number;
  comments: number;
  socialClicks: number;
  clicksByPlatform: { platform: string; clicks: number }[];
  viewsLast24h: number;
  viewsLastHour: number;
  viewsByCountry: { country: string; views: number }[];
  viewersByRole: { role: string; viewers: number }[];
  recentActivity: ActivityItem[];
}

export async function getProfileAnalytics(profileId: string): Promise<ProfileAnalytics> {
  const now = Math.floor(Date.now() / 1000);
  const [
    views,
    likes,
    comments,
    socialClicks,
    clicksByPlatform,
    viewsLast24h,
    viewsLastHour,
    viewsByCountry,
    viewersByRole,
    recentActivity,
  ] = await Promise.all([
    countProfileViews(profileId),
    countProfileLikes(profileId),
    countCommentsByProfileId(profileId),
    countSocialClicksByProfileId(profileId),
    countSocialClicksByPlatform(profileId),
    countViewEventsSince(profileId, now - 24 * 60 * 60),
    countViewEventsSince(profileId, now - 60 * 60),
    countViewsByCountry(profileId),
    countViewersByRole(profileId),
    findRecentActivity(profileId),
  ]);
  return {
    views,
    likes,
    comments,
    socialClicks,
    clicksByPlatform,
    viewsLast24h,
    viewsLastHour,
    viewsByCountry,
    viewersByRole,
    recentActivity,
  };
}
