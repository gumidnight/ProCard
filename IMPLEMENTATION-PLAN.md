# RankCard — Implementation Plan

## 1. Project Scaffold Steps & Exact Commands

```bash
# Step 1 — Bootstrap Next.js 15
pnpm create next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Step 2 — Install runtime dependencies
pnpm add @opennextjs/cloudflare framer-motion

# Step 3 — Install dev tooling
pnpm add -D wrangler prettier eslint-config-prettier @types/node

# Step 4 — Log in to Cloudflare (one-time)
npx wrangler login

# Step 5 — Create Cloudflare resources
npx wrangler d1 create rankcard-db
npx wrangler kv namespace create rankcard-kv
npx wrangler r2 bucket create rankcard-assets

# Step 6 — Apply the first migration locally and remotely
npx wrangler d1 migrations apply rankcard-db --local
npx wrangler d1 migrations apply rankcard-db --remote

# Step 7 — Verify local dev works
npx wrangler dev
```

**`package.json` scripts to add:**
```json
{
  "dev:next": "next dev",
  "build": "next build",
  "build:worker": "opennextjs-cloudflare",
  "preview": "npm run build:worker && wrangler dev",
  "deploy": "npm run build:worker && wrangler deploy",
  "db:migrate:local": "wrangler d1 migrations apply rankcard-db --local",
  "db:migrate:remote": "wrangler d1 migrations apply rankcard-db --remote",
  "typecheck": "tsc --noEmit",
  "lint": "eslint ."
}
```

---

## 2. Full D1 Schema — `migrations/0001_initial_schema.sql`

```sql
-- ============================================================
-- RankCard — D1 Initial Schema
-- Migration: 0001_initial_schema.sql
-- Note: UUIDs generated in application code via crypto.randomUUID()
--       SQLite stores booleans as INTEGER (0/1)
--       Timestamps stored as INTEGER (Unix seconds via unixepoch())
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
  id                  TEXT    PRIMARY KEY,
  profile_id          TEXT    NOT NULL,
  game                TEXT    NOT NULL CHECK (game IN ('lol', 'valorant', 'cs2')),

  -- Riot fields (lol + valorant share a PUUID via RSO)
  puuid               TEXT,
  account_name        TEXT,
  summoner_id         TEXT,
  riot_access_token   TEXT,
  riot_refresh_token  TEXT,
  riot_token_expires_at INTEGER,

  -- Faceit fields (cs2)
  faceit_player_id    TEXT,
  faceit_nickname     TEXT,

  -- Current rank snapshot
  rank_tier           TEXT,
  rank_division       TEXT,
  lp_rr               INTEGER,
  skill_level         INTEGER,

  -- Peak rank
  peak_rank_tier      TEXT,
  peak_rank_division  TEXT,

  queue_type          TEXT    NOT NULL DEFAULT 'RANKED_SOLO_5x5'
                              CHECK (queue_type IN (
                                'RANKED_SOLO_5x5','RANKED_FLEX_5x5',
                                'competitive','premier'
                              )),

  last_refreshed_at   INTEGER,
  created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at          INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (profile_id, game)
);

CREATE INDEX idx_gc_profile_id       ON game_connections(profile_id);
CREATE INDEX idx_gc_last_refreshed   ON game_connections(last_refreshed_at);

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
```

---

## 3. File & Folder Structure

```
rankcard/
├── app/
│   ├── layout.tsx                    Root layout (fonts, global CSS, providers)
│   ├── page.tsx                      Landing page
│   ├── globals.css                   CSS custom properties (colour tokens)
│   ├── [slug]/
│   │   └── page.tsx                  Public profile (SSR, reads from D1/KV)
│   ├── login/
│   │   └── page.tsx                  Redirect-only page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts              Discord OAuth callback handler
│   ├── onboarding/
│   │   ├── page.tsx                  Profile builder shell
│   │   └── layout.tsx                Onboarding layout (no nav)
│   ├── dashboard/
│   │   ├── page.tsx                  Player dashboard
│   │   └── layout.tsx                Dashboard layout (auth guard)
│   └── api/
│       ├── auth/
│       │   ├── discord/
│       │   │   └── route.ts          Initiates Discord OAuth
│       │   └── logout/
│       │       └── route.ts          Clears session cookie + KV
│       ├── profile/
│       │   ├── route.ts              GET / POST / PATCH
│       │   ├── avatar/
│       │   │   └── route.ts          PUT avatar → R2
│       │   └── slug/
│       │       └── route.ts          GET slug availability
│       ├── connect/
│       │   ├── riot/
│       │   │   ├── route.ts          Initiate Riot RSO OAuth
│       │   │   └── callback/
│       │   │       └── route.ts      Exchange code, fetch rank
│       │   └── faceit/
│       │       └── route.ts          POST faceit nickname → fetch ELO
│       └── ranks/
│           └── refresh/
│               └── route.ts          Manual refresh (rate-limited)
│
├── components/
│   ├── profile/
│   │   ├── ProfileHeader.tsx
│   │   ├── LiveRanksSection.tsx
│   │   ├── RankCard.tsx
│   │   ├── CompetitiveHistorySection.tsx
│   │   ├── TeamHistoryItem.tsx
│   │   ├── SocialLinksSection.tsx
│   │   ├── SocialLinkButton.tsx
│   │   ├── GamesSection.tsx
│   │   └── ProfileFooterCTA.tsx
│   ├── builder/
│   │   ├── OnboardingShell.tsx
│   │   ├── Step1Identity.tsx
│   │   ├── Step2Games.tsx
│   │   ├── Step3Connections.tsx
│   │   ├── Step4History.tsx
│   │   └── Step5Publish.tsx
│   ├── landing/
│   │   ├── Hero.tsx
│   │   ├── DemoProfile.tsx
│   │   ├── HowItWorks.tsx
│   │   └── LandingFooter.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Badge.tsx
│       ├── StatusBadge.tsx
│       ├── RankTierPill.tsx
│       ├── SlugInput.tsx
│       ├── CountrySelect.tsx
│       └── Avatar.tsx
│
├── lib/
│   ├── db/
│   │   ├── client.ts
│   │   ├── users.ts
│   │   ├── profiles.ts
│   │   ├── game-connections.ts
│   │   └── social-links.ts
│   ├── api/
│   │   ├── riot.ts
│   │   └── faceit.ts
│   ├── auth/
│   │   ├── discord.ts
│   │   ├── session.ts
│   │   └── middleware-helpers.ts
│   └── utils/
│       ├── rank.ts
│       ├── slug.ts
│       └── country.ts
│
├── types/
│   ├── db.ts
│   ├── api.ts
│   └── profile.ts
│
├── middleware.ts
├── wrangler.toml
├── .dev.vars
├── .dev.vars.example
├── next.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── migrations/
│   └── 0001_initial_schema.sql
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

---

## 4. Implementation Order with Reasoning

| # | What | Why this order |
|---|------|----------------|
| 1 | `wrangler.toml` + `next.config.ts` | Every subsequent step depends on bindings being configured |
| 2 | D1 migrations apply | Types and DB helpers can't be written without a known schema |
| 3 | `/types/db.ts` + `/types/profile.ts` | TypeScript strict mode — types before any logic |
| 4 | `/lib/db/client.ts` | All DB helpers depend on the `getCloudflareContext()` wrapper |
| 5 | `/lib/db/users.ts` + `profiles.ts` | Auth flow writes to these immediately |
| 6 | `/lib/auth/discord.ts` + `session.ts` | Gate everything else — no routes work without auth |
| 7 | `/app/api/auth/discord/route.ts` + `/auth/callback/route.ts` | Enables actual login testing end-to-end |
| 8 | `middleware.ts` | Can't build protected routes without session validation |
| 9 | `/app/login/page.tsx` | The entry point for all users |
| 10 | `/lib/utils/slug.ts` | Needed before profile creation |
| 11 | `/app/api/profile/route.ts` + `slug/route.ts` | Core data layer for onboarding |
| 12 | `/components/builder/*` (Steps 1–5) | The first real user-facing interaction |
| 13 | `/app/onboarding/page.tsx` | Wires the step components together |
| 14 | `/lib/api/riot.ts` | Complex integration, do before Faceit |
| 15 | `/app/api/connect/riot/*` | RSO OAuth flow end-to-end |
| 16 | `/lib/api/faceit.ts` | Simpler than Riot (no OAuth, just API key) |
| 17 | `/app/api/connect/faceit/route.ts` | |
| 18 | `/app/api/ranks/refresh/route.ts` | Manual refresh before cron |
| 19 | Scheduled cron handler | Depends on refresh logic from step 18 |
| 20 | `/app/api/profile/avatar/route.ts` + R2 | Avatar upload, not blocking core flow |
| 21 | `/components/profile/*` | Build all profile display components together |
| 22 | `/app/[slug]/page.tsx` | The most important page — build last so you have real data |
| 23 | `/components/ui/*` | Extracted in parallel as needed during steps 12–22 |
| 24 | `/app/dashboard/page.tsx` | Lower priority than public profile |
| 25 | `/components/landing/*` + `/app/page.tsx` | Landing page built with a real profile to demo |
| 26 | GitHub Actions workflows | Set up after at least one successful manual deploy |

---

## 5. Technical Risks & Gotchas

### OpenNext + Cloudflare Workers — Known Friction Points

**HIGH RISK**

**Scheduled handler not auto-wired by OpenNext:**
The `crons` trigger in `wrangler.toml` expects an exported `scheduled(event, env, ctx)` function. OpenNext generates its own entrypoint and does not expose a `scheduled` export. A custom `worker-entry.ts` is needed that re-exports OpenNext's fetch handler alongside a `scheduled` handler.

**Worker bundle size:**
Next.js 15 + React 19 + Framer Motion may approach the 10 MB compressed limit on the Cloudflare free plan. Mitigations: lazy-import Framer Motion, ensure it's only in client components, consider Paid plan (25 MB limit).

**MEDIUM RISK**

**`getCloudflareContext()` only works in Workers runtime, not `next dev`:**
Running `next dev` (Node.js) will throw. Must use `wrangler dev` for any code path that touches D1/KV/R2. Slows inner dev loop.

**`next/image` optimization unavailable:**
Workers can't run `sharp`. Must set `images: { unoptimized: true }` in `next.config.ts`.

**Riot RSO OAuth state management:**
OAuth state params can't live in memory — Workers are stateless. Must write state to KV with short TTL before redirect, read/delete on callback.

**LOW RISK**

**`crypto.randomUUID()` vs SQLite UUID generation:**
Workers expose `crypto.randomUUID()`. Generate all IDs in application code before INSERT.

**D1 not fully ACID in distributed writes:**
Manual refresh rate limit must be enforced via KV atomic operations, not D1.

**Middleware runs on every matched path:**
Each execution reads from KV. Configure matcher carefully.

**Riot production API key requirement:**
Dev key has 100/2-min rate limit. Apply early.

**Local D1 migration state:**
`.wrangler/state/` is git-ignored. New clones must re-run migrations. Document in README.

---

## 6. Frontend Component Hierarchy — Public Profile Page

```
/app/[slug]/page.tsx  (Server Component — fetches from D1/KV)
└── ProfilePage (Client Component — Framer Motion orchestrator)
      ├── ProfileHeader
      │     ├── Avatar
      │     ├── DisplayName        (Rajdhani 700)
      │     ├── Tagline            (JetBrains Mono)
      │     ├── CountryFlag        (emoji)
      │     ├── RoleTags           → Badge[]
      │     └── StatusBadge
      │
      ├── LiveRanksSection         (+0.1s stagger)
      │     └── RankCard[]
      │           ├── GameIcon
      │           ├── RankTierPill
      │           ├── LPRRBadge
      │           ├── QueueLabel
      │           └── LastUpdated
      │
      ├── CompetitiveHistorySection (+0.2s)
      │     └── TeamHistoryItem[]
      │           ├── OrgName
      │           ├── RoleBadge
      │           ├── GameBadge
      │           ├── DateRange
      │           └── ResultNote
      │
      ├── SocialLinksSection       (+0.3s)
      │     └── SocialLinkButton[]
      │
      ├── GamesSection             (+0.4s)
      │     └── GameIconGrid
      │
      └── ProfileFooterCTA
```

---

## 7. Estimated Complexity per Section

| Section | Complexity | Primary risk |
|---------|-----------|--------------|
| Scaffold + wrangler.toml | Low | Getting binding IDs from Cloudflare |
| D1 schema + migrations | Low | — |
| Discord OAuth | Medium | Cookie handling across Workers/redirect |
| Session middleware | Medium | Edge runtime KV latency |
| Profile builder (5 steps) | Medium | Step state machine UX |
| Slug availability system | Low | Debounce + reserved list |
| Riot RSO OAuth | High | OAuth state in KV, token refresh, PUUID chain |
| Faceit integration | Low | Simple fetch, no OAuth |
| Rank refresh (manual) | Low | Rate limit via KV |
| Rank refresh (cron) | High | Custom Worker entrypoint for scheduled handler |
| R2 avatar upload | Medium | Multipart form parsing in Workers |
| Public profile page | Medium-High | Design quality bar is very high |
| Landing page | Medium | Demo profile component |
| GitHub Actions CI/CD | Low | Secret configuration |
