-- ============================================================
-- RankCard — D1 Initial Schema
-- Migration: 0001_initial_schema.sql
-- UUIDs generated in application code via crypto.randomUUID()
-- Booleans stored as INTEGER (0/1)
-- Timestamps stored as INTEGER (Unix seconds via unixepoch())
-- ============================================================

-- ------------------------------------------------------------
-- USERS — Discord identity
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                TEXT    PRIMARY KEY,
  discord_id        TEXT    NOT NULL UNIQUE,
  username          TEXT    NOT NULL,
  discriminator     TEXT    NOT NULL DEFAULT '0',
  avatar_url        TEXT,
  email             TEXT,
  access_token      TEXT    NOT NULL,
  refresh_token     TEXT,
  token_expires_at  INTEGER,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_users_discord_id ON users(discord_id);

-- ------------------------------------------------------------
-- PROFILES — Player public identity
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL UNIQUE,
  slug         TEXT    NOT NULL UNIQUE,
  display_name TEXT    NOT NULL,
  country      TEXT,
  tagline      TEXT,
  bio          TEXT    CHECK (length(bio) <= 280),
  avatar_key   TEXT,
  status       TEXT    NOT NULL DEFAULT 'not_looking'
                       CHECK (status IN ('on_team', 'open', 'not_looking')),
  is_published INTEGER NOT NULL DEFAULT 0,
  published_at INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_profiles_slug      ON profiles(slug);
CREATE INDEX idx_profiles_user_id   ON profiles(user_id);
CREATE INDEX idx_profiles_published ON profiles(is_published);

-- ------------------------------------------------------------
-- GAME_CONNECTIONS — Connected game accounts + live rank data
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_connections (
  id                    TEXT    PRIMARY KEY,
  profile_id            TEXT    NOT NULL,
  game                  TEXT    NOT NULL CHECK (game IN ('lol', 'valorant', 'cs2')),

  -- Riot fields (lol + valorant share a PUUID via RSO)
  puuid                 TEXT,
  account_name          TEXT,
  summoner_id           TEXT,
  riot_access_token     TEXT,
  riot_refresh_token    TEXT,
  riot_token_expires_at INTEGER,

  -- Faceit fields (cs2)
  faceit_player_id      TEXT,
  faceit_nickname       TEXT,

  -- Current rank snapshot
  rank_tier             TEXT,
  rank_division         TEXT,
  lp_rr                 INTEGER,
  skill_level           INTEGER,

  -- Peak rank
  peak_rank_tier        TEXT,
  peak_rank_division    TEXT,

  queue_type            TEXT    NOT NULL DEFAULT 'RANKED_SOLO_5x5'
                                CHECK (queue_type IN (
                                  'RANKED_SOLO_5x5','RANKED_FLEX_5x5',
                                  'competitive','premier'
                                )),

  last_refreshed_at     INTEGER,
  created_at            INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at            INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, game)
);

CREATE INDEX idx_gc_profile_id     ON game_connections(profile_id);
CREATE INDEX idx_gc_last_refreshed ON game_connections(last_refreshed_at);

-- ------------------------------------------------------------
-- SOCIAL_LINKS — External profile URLs
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_links (
  id            TEXT    PRIMARY KEY,
  profile_id    TEXT    NOT NULL,
  platform      TEXT    NOT NULL CHECK (platform IN (
                  'discord','twitch','twitter','youtube','opgg','tracker'
                )),
  handle_or_url TEXT    NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, platform)
);

CREATE INDEX idx_social_links_profile_id ON social_links(profile_id);

-- ------------------------------------------------------------
-- TEAM_HISTORY — Competitive org/team history
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_history (
  id            TEXT    PRIMARY KEY,
  profile_id    TEXT    NOT NULL,
  org_name      TEXT    NOT NULL,
  role          TEXT,
  game          TEXT    NOT NULL,
  start_date    TEXT,
  end_date      TEXT,
  result_note   TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_team_history_profile_id ON team_history(profile_id);

-- ------------------------------------------------------------
-- ROLES_PLAYED — Games and roles a player identifies with
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles_played (
  id            TEXT    PRIMARY KEY,
  profile_id    TEXT    NOT NULL,
  game          TEXT    NOT NULL,
  role          TEXT    NOT NULL,
  is_main       INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, game, role)
);

CREATE INDEX idx_roles_played_profile_id ON roles_played(profile_id);
