-- ============================================================
-- 0005_profile_status_note.sql
-- Adds a free-form "currently" description on profiles.
-- Examples: "Mid laner for Cloud9 — focused on LCS Spring split"
--           "Free agent — looking for a mid role in EUW/EUNE"
-- ============================================================

ALTER TABLE profiles ADD COLUMN status_note TEXT;
