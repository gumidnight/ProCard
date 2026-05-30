-- ============================================================
-- 0004_team_history_extras.sql
-- Adds tournament/league + organisation logo to team_history.
-- ============================================================

ALTER TABLE team_history ADD COLUMN tournament_name TEXT;
ALTER TABLE team_history ADD COLUMN org_logo_url    TEXT;
