-- Player-card redesign: verified badge, reserved pro flag, banner image,
-- and background customization (default house bg / preset / custom upload).
-- is_pro is reserved for future gating and is NOT enforced anywhere yet.
ALTER TABLE profiles ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN is_pro INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN banner_key TEXT;
ALTER TABLE profiles ADD COLUMN background_type TEXT NOT NULL DEFAULT 'default';
ALTER TABLE profiles ADD COLUMN background_preset TEXT;
ALTER TABLE profiles ADD COLUMN background_key TEXT;
