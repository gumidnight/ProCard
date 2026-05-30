-- ============================================================
-- 0008_social_clicks.sql
-- Tracks outbound clicks on a profile's social links (analytics).
-- Raw clicks (not deduped) — each click is one row.
-- ============================================================

CREATE TABLE IF NOT EXISTS social_link_clicks (
  id             TEXT    PRIMARY KEY,
  profile_id     TEXT    NOT NULL,
  social_link_id TEXT    NOT NULL,
  platform       TEXT    NOT NULL,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (profile_id)     REFERENCES profiles(id)     ON DELETE CASCADE,
  FOREIGN KEY (social_link_id) REFERENCES social_links(id) ON DELETE CASCADE
);

CREATE INDEX idx_social_link_clicks_profile_id ON social_link_clicks(profile_id);
CREATE INDEX idx_social_link_clicks_platform   ON social_link_clicks(profile_id, platform);
