-- ============================================================
-- ProCard — Migration 0007
-- Allow multiple game accounts per game (remove UNIQUE(profile_id, game)).
-- Add 'tft' as a supported game type.
-- Add 'RANKED_TFT' to the queue_type check.
-- ============================================================

PRAGMA foreign_keys = OFF;

CREATE TABLE game_connections_new (
  id                    TEXT    PRIMARY KEY,
  profile_id            TEXT    NOT NULL,
  game                  TEXT    NOT NULL CHECK (game IN ('lol', 'valorant', 'tft', 'cs2')),

  puuid                 TEXT,
  account_name          TEXT,
  summoner_id           TEXT,
  riot_access_token     TEXT,
  riot_refresh_token    TEXT,
  riot_token_expires_at INTEGER,

  faceit_player_id      TEXT,
  faceit_nickname       TEXT,

  rank_tier             TEXT,
  rank_division         TEXT,
  lp_rr                 INTEGER,
  skill_level           INTEGER,

  peak_rank_tier        TEXT,
  peak_rank_division    TEXT,

  region                TEXT,

  queue_type            TEXT    NOT NULL DEFAULT 'RANKED_SOLO_5x5'
                                CHECK (queue_type IN (
                                  'RANKED_SOLO_5x5', 'RANKED_FLEX_5x5',
                                  'competitive', 'premier', 'RANKED_TFT'
                                )),

  is_visible            INTEGER NOT NULL DEFAULT 1,
  last_refreshed_at     INTEGER,
  created_at            INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at            INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
  -- UNIQUE (profile_id, game) intentionally removed — players can link multiple accounts per game
);

INSERT INTO game_connections_new
SELECT id, profile_id, game, puuid, account_name, summoner_id,
       riot_access_token, riot_refresh_token, riot_token_expires_at,
       faceit_player_id, faceit_nickname,
       rank_tier, rank_division, lp_rr, skill_level,
       peak_rank_tier, peak_rank_division,
       region, queue_type, is_visible, last_refreshed_at,
       created_at, updated_at
FROM game_connections;

DROP TABLE game_connections;
ALTER TABLE game_connections_new RENAME TO game_connections;

CREATE INDEX idx_gc_profile_id     ON game_connections(profile_id);
CREATE INDEX idx_gc_last_refreshed ON game_connections(last_refreshed_at);

PRAGMA foreign_keys = ON;
