-- ============================================================
-- 0009_view_events.sql
-- Per-view event stream (NOT deduped like profile_views).
-- Backbone for: recent activity feed, geography, live/recent
-- view counts, and the premium "who viewed you" reveal.
--   • viewer_user_id — signed-in viewer (NULL for anonymous)
--   • referrer       — traffic source host (e.g. "twitter.com")
--   • country        — ISO country code from the CDN edge
-- ============================================================

CREATE TABLE IF NOT EXISTS profile_view_events (
  id             TEXT    PRIMARY KEY,
  profile_id     TEXT    NOT NULL,
  visitor_id     TEXT    NOT NULL,
  viewer_user_id TEXT,
  referrer       TEXT,
  country        TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (profile_id)     REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (viewer_user_id) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_pve_profile_created ON profile_view_events(profile_id, created_at);
CREATE INDEX idx_pve_profile_viewer  ON profile_view_events(profile_id, viewer_user_id);
CREATE INDEX idx_pve_profile_country ON profile_view_events(profile_id, country);
