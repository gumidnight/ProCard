import { getDb, ensureMigrated } from "./client";
import type { ProfileCommentRow, ProfileCommentWithAuthor } from "@/types/db";

// ---------------------------------------------------------------------------
// Views (anonymous, deduped per visitor_id)
// ---------------------------------------------------------------------------

export function countProfileViews(profileId: string): number {
  ensureMigrated();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM profile_views WHERE profile_id = ?")
    .get(profileId) as { n: number };
  return row.n;
}

/** Insert a (profile, visitor) view row, ignoring duplicates. Returns true if newly inserted. */
export function recordProfileView(profileId: string, visitorId: string): boolean {
  ensureMigrated();
  const db = getDb();
  const res = db
    .prepare(
      `INSERT OR IGNORE INTO profile_views (id, profile_id, visitor_id)
       VALUES (?, ?, ?)`,
    )
    .run(crypto.randomUUID(), profileId, visitorId);
  return res.changes > 0;
}

// ---------------------------------------------------------------------------
// Likes (anonymous toggle)
// ---------------------------------------------------------------------------

export function countProfileLikes(profileId: string): number {
  ensureMigrated();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM profile_likes WHERE profile_id = ?")
    .get(profileId) as { n: number };
  return row.n;
}

export function hasVisitorLiked(profileId: string, visitorId: string): boolean {
  ensureMigrated();
  const row = getDb()
    .prepare("SELECT 1 AS x FROM profile_likes WHERE profile_id = ? AND visitor_id = ?")
    .get(profileId, visitorId) as { x: number } | undefined;
  return !!row;
}

/** Toggles a like for the visitor. Returns the new liked state. */
export function toggleProfileLike(
  profileId: string,
  visitorId: string,
): { liked: boolean; total: number } {
  ensureMigrated();
  const db = getDb();
  const existing = db
    .prepare("SELECT id FROM profile_likes WHERE profile_id = ? AND visitor_id = ?")
    .get(profileId, visitorId) as { id: string } | undefined;

  if (existing) {
    db.prepare("DELETE FROM profile_likes WHERE id = ?").run(existing.id);
  } else {
    db.prepare(
      `INSERT INTO profile_likes (id, profile_id, visitor_id)
       VALUES (?, ?, ?)`,
    ).run(crypto.randomUUID(), profileId, visitorId);
  }

  return {
    liked: !existing,
    total: countProfileLikes(profileId),
  };
}

// ---------------------------------------------------------------------------
// Comments (require login)
// ---------------------------------------------------------------------------

export function findCommentsByProfileId(profileId: string): ProfileCommentWithAuthor[] {
  ensureMigrated();
  return getDb()
    .prepare(
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
    )
    .all(profileId) as ProfileCommentWithAuthor[];
}

export function countCommentsByProfileId(profileId: string): number {
  ensureMigrated();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM profile_comments WHERE profile_id = ?")
    .get(profileId) as { n: number };
  return row.n;
}

export function createComment(args: {
  profile_id: string;
  user_id: string;
  body: string;
}): ProfileCommentRow {
  ensureMigrated();
  const db = getDb();
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO profile_comments (id, profile_id, user_id, body)
     VALUES (?, ?, ?, ?)`,
  ).run(id, args.profile_id, args.user_id, args.body);
  return db
    .prepare("SELECT * FROM profile_comments WHERE id = ?")
    .get(id) as ProfileCommentRow;
}

export function findCommentById(id: string): ProfileCommentRow | null {
  ensureMigrated();
  return (
    (getDb().prepare("SELECT * FROM profile_comments WHERE id = ?").get(id) as
      | ProfileCommentRow
      | undefined) ?? null
  );
}

export function deleteCommentById(id: string): void {
  ensureMigrated();
  getDb().prepare("DELETE FROM profile_comments WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Social link clicks (raw outbound-click counter, per platform)
// ---------------------------------------------------------------------------

/** Records a single outbound click on one of a profile's social links. */
export function recordSocialClick(args: {
  profile_id: string;
  social_link_id: string;
  platform: string;
}): void {
  ensureMigrated();
  getDb()
    .prepare(
      `INSERT INTO social_link_clicks (id, profile_id, social_link_id, platform)
       VALUES (?, ?, ?, ?)`,
    )
    .run(crypto.randomUUID(), args.profile_id, args.social_link_id, args.platform);
}

export function countSocialClicksByProfileId(profileId: string): number {
  ensureMigrated();
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM social_link_clicks WHERE profile_id = ?")
    .get(profileId) as { n: number };
  return row.n;
}

/** Click totals grouped by platform, highest first. */
export function countSocialClicksByPlatform(
  profileId: string,
): { platform: string; clicks: number }[] {
  ensureMigrated();
  return getDb()
    .prepare(
      `SELECT platform, COUNT(*) AS clicks
       FROM social_link_clicks
       WHERE profile_id = ?
       GROUP BY platform
       ORDER BY clicks DESC`,
    )
    .all(profileId) as { platform: string; clicks: number }[];
}

// ---------------------------------------------------------------------------
// View events (per-view stream: recent activity, geography, live counts)
// ---------------------------------------------------------------------------

/** Skip re-logging the same visitor on a profile within this window (seconds). */
const VIEW_EVENT_DEDUP_WINDOW = 1800; // 30 min

/**
 * Records a single view event. Deduped per (profile, visitor) within a
 * 30-minute window so refreshes don't spam the activity feed / live counts.
 * Returns true if a new event row was inserted.
 */
export function recordViewEvent(args: {
  profile_id: string;
  visitor_id: string;
  viewer_user_id?: string | null;
  referrer?: string | null;
  country?: string | null;
}): boolean {
  ensureMigrated();
  const db = getDb();
  const recent = db
    .prepare(
      `SELECT 1 AS x FROM profile_view_events
       WHERE profile_id = ? AND visitor_id = ?
         AND created_at > unixepoch() - ?`,
    )
    .get(args.profile_id, args.visitor_id, VIEW_EVENT_DEDUP_WINDOW) as
    | { x: number }
    | undefined;
  if (recent) return false;

  db.prepare(
    `INSERT INTO profile_view_events
       (id, profile_id, visitor_id, viewer_user_id, referrer, country)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    crypto.randomUUID(),
    args.profile_id,
    args.visitor_id,
    args.viewer_user_id ?? null,
    args.referrer ?? null,
    args.country ?? null,
  );
  return true;
}

/** View-event count since a unix timestamp (for "last 24h" / "last hour"). */
export function countViewEventsSince(profileId: string, sinceTs: number): number {
  ensureMigrated();
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM profile_view_events
       WHERE profile_id = ? AND created_at >= ?`,
    )
    .get(profileId, sinceTs) as { n: number };
  return row.n;
}

/** View counts grouped by country, highest first. NULL countries excluded. */
export function countViewsByCountry(
  profileId: string,
): { country: string; views: number }[] {
  ensureMigrated();
  return getDb()
    .prepare(
      `SELECT country, COUNT(*) AS views
       FROM profile_view_events
       WHERE profile_id = ? AND country IS NOT NULL AND country <> ''
       GROUP BY country
       ORDER BY views DESC`,
    )
    .all(profileId) as { country: string; views: number }[];
}

/**
 * Distinct signed-in viewers grouped by their primary esports role.
 * Powers the free "3 coaches, 2 managers viewed you" preview.
 * (Identities stay paywalled — this is counts only.)
 */
export function countViewersByRole(
  profileId: string,
): { role: string; viewers: number }[] {
  ensureMigrated();
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT e.viewer_user_id AS user_id, p.esports_role AS roles
       FROM profile_view_events e
       JOIN profiles p ON p.user_id = e.viewer_user_id
       WHERE e.profile_id = ? AND e.viewer_user_id IS NOT NULL`,
    )
    .all(profileId) as { user_id: string; roles: string | null }[];

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
// Recent activity feed (merged stream across engagement types)
// ---------------------------------------------------------------------------

export type ActivityKind = "view" | "like" | "comment" | "click";

export interface ActivityItem {
  kind: ActivityKind;
  created_at: number;
  /** view: ISO country code (nullable) */
  country?: string | null;
  /** view: primary esports role of a signed-in viewer (nullable, free tier) */
  viewerRole?: string | null;
  /** click: social platform */
  platform?: string | null;
}

/** Most recent engagement events across views, likes, comments, and clicks. */
export function findRecentActivity(profileId: string, limit = 12): ActivityItem[] {
  ensureMigrated();
  const db = getDb();

  const views = db
    .prepare(
      `SELECT e.created_at, e.country, p.esports_role AS roles
       FROM profile_view_events e
       LEFT JOIN profiles p ON p.user_id = e.viewer_user_id
       WHERE e.profile_id = ?
       ORDER BY e.created_at DESC LIMIT ?`,
    )
    .all(profileId, limit) as {
    created_at: number;
    country: string | null;
    roles: string | null;
  }[];

  const likes = db
    .prepare(
      `SELECT created_at FROM profile_likes
       WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(profileId, limit) as { created_at: number }[];

  const comments = db
    .prepare(
      `SELECT created_at FROM profile_comments
       WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(profileId, limit) as { created_at: number }[];

  const clicks = db
    .prepare(
      `SELECT created_at, platform FROM social_link_clicks
       WHERE profile_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(profileId, limit) as { created_at: number; platform: string }[];

  const items: ActivityItem[] = [
    ...views.map((v) => ({
      kind: "view" as const,
      created_at: v.created_at,
      country: v.country,
      viewerRole: v.roles ? v.roles.split(",")[0].trim() || null : null,
    })),
    ...likes.map((l) => ({ kind: "like" as const, created_at: l.created_at })),
    ...comments.map((c) => ({
      kind: "comment" as const,
      created_at: c.created_at,
    })),
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
  // Free trio
  viewsLast24h: number;
  viewsLastHour: number;
  viewsByCountry: { country: string; views: number }[];
  viewersByRole: { role: string; viewers: number }[];
  recentActivity: ActivityItem[];
}

export function getProfileAnalytics(profileId: string): ProfileAnalytics {
  const now = Math.floor(Date.now() / 1000);
  return {
    views: countProfileViews(profileId),
    likes: countProfileLikes(profileId),
    comments: countCommentsByProfileId(profileId),
    socialClicks: countSocialClicksByProfileId(profileId),
    clicksByPlatform: countSocialClicksByPlatform(profileId),
    viewsLast24h: countViewEventsSince(profileId, now - 24 * 60 * 60),
    viewsLastHour: countViewEventsSince(profileId, now - 60 * 60),
    viewsByCountry: countViewsByCountry(profileId),
    viewersByRole: countViewersByRole(profileId),
    recentActivity: findRecentActivity(profileId),
  };
}
