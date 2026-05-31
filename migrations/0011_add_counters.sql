-- ============================================================
-- 0011_add_counters.sql
-- Denormalized engagement counters on profiles.
-- Replaces per-view COUNT(*) queries with O(1) reads on the
-- hot public-profile render path. Populated lazily on write.
-- ============================================================
ALTER TABLE profiles ADD COLUMN view_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN like_count    INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN comment_count INTEGER NOT NULL DEFAULT 0;
