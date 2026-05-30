-- ============================================================
-- 0003_engagement.sql
-- Adds public-profile engagement: unique visits, likes, comments
-- ============================================================

-- One row per unique anonymous visitor per profile (dedupes views).
CREATE TABLE IF NOT EXISTS profile_views (
  id         TEXT    PRIMARY KEY,
  profile_id TEXT    NOT NULL,
  visitor_id TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, visitor_id)
);

CREATE INDEX idx_profile_views_profile_id ON profile_views(profile_id);

-- One row per (profile, anonymous visitor) — toggle insert/delete to like/unlike.
CREATE TABLE IF NOT EXISTS profile_likes (
  id         TEXT    PRIMARY KEY,
  profile_id TEXT    NOT NULL,
  visitor_id TEXT    NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, visitor_id)
);

CREATE INDEX idx_profile_likes_profile_id ON profile_likes(profile_id);

-- Comments require a logged-in ProCard user. Body capped at 1000 chars.
CREATE TABLE IF NOT EXISTS profile_comments (
  id         TEXT    PRIMARY KEY,
  profile_id TEXT    NOT NULL,
  user_id    TEXT    NOT NULL,
  body       TEXT    NOT NULL CHECK (length(body) <= 1000),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
);

CREATE INDEX idx_profile_comments_profile_id ON profile_comments(profile_id);
CREATE INDEX idx_profile_comments_created_at ON profile_comments(created_at);
