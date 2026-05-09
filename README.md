# ProCard.gg

Esports identity platform. One link with live verified ranks, team history, and socials — built for competitive players. Think Linktree, but with live Riot API rank data.

**Status:** MVP in active development. Core features working locally.

---

## What works right now

- **Discord OAuth login** — sign in, session via HMAC-signed cookie (`procard_session`)
- **5-step onboarding** — identity, games, Riot connection, team history, publish
- **Riot API integration** — connect Riot account (RSO OAuth or manual Riot ID), pulls LoL + Valorant ranks
- **Region picker** — 11 Riot regions (EUW, EUNE, NA, KR, etc.) stored per connection
- **Dashboard** — split editor + live phone preview, all sections editable inline
- **Public profile page** — `localhost:3000/{slug}` with live ranks, socials, team history
- **18 esports roles** — player, coach, analyst, team_owner, caster, scout, etc.
- **Rank display** — colour-coded by tier (Iron through Challenger/Radiant), LP/RR shown
- **Brand system** — dark esports aesthetic, Rajdhani + Inter + JetBrains Mono fonts

## What's NOT built yet

- Faceit (CS2) integration
- Cloudflare deployment (Workers + D1 + KV + R2)
- Scheduled rank refresh cron
- Avatar upload (R2)
- GitHub Actions CI/CD
- Any premium/paid features

---

## Tech stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (@theme inline tokens) |
| Animation | Framer Motion |
| Database | better-sqlite3 (local dev) → Cloudflare D1 (prod) |
| Auth | Discord OAuth2 → stateless HMAC-signed cookies |
| External APIs | Riot RSO OAuth + Riot Data APIs |
| Fonts | Rajdhani (display), Inter (body), JetBrains Mono (mono) |

---

## Local development

```bash
# Install
pnpm install

# Create .dev.vars with your secrets (see .dev.vars.example)
cp .dev.vars.example .dev.vars

# Run dev server
pnpm dev
# → http://localhost:3000

# Typecheck
npx tsc --noEmit
```

### Required environment variables

See `.dev.vars.example` for the full list. You need at minimum:
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` / `DISCORD_REDIRECT_URI`
- `RIOT_CLIENT_ID` / `RIOT_CLIENT_SECRET` / `RIOT_API_KEY`
- `SESSION_SECRET`

### Database

SQLite via better-sqlite3, stored at `.wrangler/state/procard.db`. Auto-migrates on first request using `migrations/0001_initial_schema.sql`. Delete the DB file to reset.

---

## Project structure

```
app/
  page.tsx                    Landing page (marketing)
  login/page.tsx              Discord OAuth login
  onboarding/page.tsx         5-step profile builder
  dashboard/page.tsx          Authenticated editor + preview
  [slug]/page.tsx             Public profile page
  api/
    auth/discord/             Discord OAuth start
    auth/callback/            OAuth callback
    auth/me/                  Current user
    auth/logout/              Logout
    connect/riot/             Riot connect start + callback
    profile/                  Profile CRUD, socials, roles, team history, slug check
    ranks/refresh/            Manual rank refresh

components/
  ui/                         Primitives (Button, Input, Select, Badge, StatusBadge, etc.)
  builder/                    Onboarding steps (Step1–Step5)
  dashboard/                  Editor cards (ProfileEdit, Connections, Socials, Status, TeamHistory)
  profile/                    Public display (ProfileHeader, LiveRanks, SocialLinks, CompetitiveHistory)

lib/
  api/riot.ts                 Riot API client + RSO OAuth
  api/riot-regions.ts         Region definitions (RiotRegion type, 11 regions)
  auth/discord.ts             Discord OAuth helpers
  auth/session.ts             HMAC session signing/verification
  constants/esports-roles.ts  18 esports role definitions
  db/                         SQLite query helpers (profiles, users, game-connections, etc.)
  utils/                      Rank formatting, slug validation, country flags

types/
  db.ts                       Database row types (ProfileRow, GameConnectionRow, etc.)
  api.ts                      API response types
  profile.ts                  Profile display types

migrations/
  0001_initial_schema.sql     Full schema (users, profiles, game_connections, social_links, team_history, roles_played)

procard-brand-guidelines.md   Full brand spec (colours, fonts, spacing, voice)
COPILOT-INSTRUCTIONS.md       AI agent context for continuation
```

---

## Design system

Dark-first esports aesthetic. No shadows — border-only elevation. No emojis as icons.

- **Backgrounds:** `#07070f` → `#0f0f1c` → `#161625` → `#1e1e30`
- **Accent:** `#534AB7` / `#7b72d4`
- **Rank colours:** 12 tiers from Iron (`#BA7517`) through Challenger (`#D4AF37`)
- **Fonts:** Rajdhani 400–700 (display), Inter 400–600 (body), JetBrains Mono (code)
- **Cards:** `border-radius: 10px`, border transitions on hover, no box-shadow
- **Section labels:** 9px uppercase, `tracking: 0.16em`, muted colour
- **Animations:** all ≤ 300ms, no spring physics

Full spec in `procard-brand-guidelines.md`.

---

## Key decisions & gotchas

- **Auth is stateless** — HMAC-signed cookies, no KV session store needed for local dev
- **Cookie name:** `procard_session`
- **DB resets** — schema changes require deleting `.wrangler/state/` DB files. User must re-login and re-onboard after reset.
- **Riot regions** — ranks depend on correct region. The region picker is crucial (user was showing Unranked because region was hardcoded to EUW when they play on EUNE).
- **No emojis as icons** — game badges use styled text abbreviations (LoL, VAL, CS2, RIOT), social platforms use 3-letter text labels. This was a deliberate design decision to avoid looking generic.
- **Tailwind v4** — uses `@theme` inline in `globals.css`, no `tailwind.config.js` file.
- **better-sqlite3** — local-only dev database. Production target is Cloudflare D1 (not yet implemented).

