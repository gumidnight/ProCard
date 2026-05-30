-- ============================================================
-- ProCard — Migration 0002
-- Adds is_visible flag to game_connections so users can hide
-- individual games from their public profile without removing
-- the connection entirely.
-- ============================================================

ALTER TABLE game_connections
  ADD COLUMN is_visible INTEGER NOT NULL DEFAULT 1;
