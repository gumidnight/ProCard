-- Inline "currently on a team" fields stored directly on the profile.
-- Decoupled from team_history so users can edit availability without
-- creating/closing history entries.
ALTER TABLE profiles ADD COLUMN current_team_name TEXT;
ALTER TABLE profiles ADD COLUMN current_team_logo_url TEXT;
ALTER TABLE profiles ADD COLUMN current_league TEXT;
ALTER TABLE profiles ADD COLUMN current_role TEXT;
ALTER TABLE profiles ADD COLUMN current_game TEXT;
