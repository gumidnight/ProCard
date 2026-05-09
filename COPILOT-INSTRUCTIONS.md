# ProCard.gg — AI Agent Context

## CURRENT STATE (as of May 2026)

> **Read this section first.** It tells you exactly where the project is and what has been built.

### What's done (all working, typechecks pass)

- **Renamed from RankCard → ProCard** — all files, DB, cookies, wrangler config updated. Folder is still `RankCard/` but everything inside says ProCard.
- **Discord OAuth login** — full flow, stateless HMAC-signed cookies (`procard_session`)
- **5-step onboarding builder** — identity, games + roles, Riot connection, team history, publish
- **Riot API integration** — RSO OAuth + manual Riot ID fallback, fetches LoL + Valorant ranks
- **Region picker** — 11 Riot regions with correct routing cluster mapping, stored in DB per connection
- **Dashboard** — split editor (left) + live phone preview (right), all sections editable inline, preview/editor toggle on all screen sizes, floating "← Back to edit" pill
- **Public profile page** — `/{slug}` with Framer Motion stagger animations, live ranks, socials, team history, esports role badge, country badge, status badge
- **18 esports roles** — player, coach, analyst, team_owner, team_manager, commentator, caster, host, media_manager, content_creator, journalist, tournament_organizer, referee, scout, agent, streamer, designer, observer
- **Brand system fully applied** — all tokens in globals.css @theme, all UI primitives use semantic tokens, 12 rank tier colours, 3 animation keyframes
- **No emojis anywhere** — game badges use styled text (LoL/VAL/CS2), social platforms use 3-letter labels, CardShell icons removed
- **Professional landing page** — nav, hero ("Your verified esports identity"), 3-column value props grid, CTA, footer
- **Login page** — clean Discord OAuth with SVG icon, permission disclosure
- **UI primitives** — Button (4 variants), Input, TextArea, Select, Badge, StatusBadge, SlugInput

### What's NOT built yet

- Faceit (CS2) integration — API client not written
- Cloudflare deployment — still using local better-sqlite3, no D1/KV/R2 bindings
- Scheduled rank refresh cron — no Worker cron yet
- Avatar upload — no R2 integration
- GitHub Actions CI/CD — no workflows
- Search/analytics/premium features — out of MVP scope

### Key technical details

- **Framework:** Next.js 16.2.6 with Turbopack, React 19.2.4, TS strict ES2017
- **Tailwind v4.2.4:** `@theme` inline in `app/globals.css` (NO tailwind.config.js)
- **Database:** better-sqlite3 at `.wrangler/state/procard.db`, auto-migrates from `migrations/0001_initial_schema.sql`
- **Auth:** Stateless HMAC-signed cookies, cookie name `procard_session`, verified in `middleware.ts`
- **Fonts:** Rajdhani (400/500/600/700 display), Inter (400/500/600 body), JetBrains Mono (400/500 mono)
- **Brand spec:** `procard-brand-guidelines.md` is the authoritative design reference
- **DB resets:** Schema changes require deleting `.wrangler/state/` DB files → user must re-login

### File map (key files)

| File | Purpose |
|------|---------|
| `app/globals.css` | Full @theme token system: bg layers, borders, text, accent, rank colours, animations |
| `app/layout.tsx` | Root layout with Rajdhani + Inter + JetBrains Mono font imports |
| `app/page.tsx` | Marketing landing page (nav, hero, value props, CTA, footer) |
| `app/login/page.tsx` | Discord OAuth login with SVG icon |
| `app/[slug]/page.tsx` | Public profile (server component, fetches data) |
| `components/profile/ProfilePageClient.tsx` | Client wrapper with Framer Motion stagger |
| `components/profile/LiveRanksSection.tsx` | Rank cards with tier-tinted bg/border via getRankHex() |
| `components/dashboard/DashboardClient.tsx` | Split editor + phone preview, PROCARD.GG wordmark |
| `components/dashboard/ConnectionsCard.tsx` | Region picker, disconnect, refresh, rank display |
| `lib/api/riot.ts` | Riot API client (re-exports from riot-regions.ts) |
| `lib/api/riot-regions.ts` | RiotRegion type + RIOT_REGIONS array (11 regions) |
| `lib/constants/esports-roles.ts` | 18 role definitions |
| `lib/utils/rank.ts` | getRankColour() (CSS vars) + getRankHex() (raw hex) |
| `types/db.ts` | ProfileRow (has esports_role), GameConnectionRow (has region) |
| `migrations/0001_initial_schema.sql` | Full schema with esports_role + region columns |

### Design rules (enforced, do not deviate)

- No gradients, no box-shadows (border-only elevation)
- No emojis as icons (use styled text abbreviations)
- Animations ≤ 300ms, no spring physics
- Section labels: 9px uppercase, tracking 0.16em, text-muted
- Rank data always in font-display (Rajdhani), never Inter
- Cards: rounded-[10px], border-subtle, bg-surface
- Accent used sparingly: CTAs and active states only
- Copy: factual, direct, no exclamation marks, no gamer slang

---

## ORIGINAL SPEC (reference — some parts are already built)

The sections below are the original product spec. Refer to the "CURRENT STATE" section above to know what's actually implemented vs. planned.

---

## Context & Background

You are building **RankCard** — an esports identity platform for competitive players. Think Linktree, but built specifically for gamers, with live verified rank data pulled directly from game APIs.

The problem: competitive players have no single place to showcase who they are. Their rank is on Tracker.gg. Their results are on Liquipedia (if they're a pro). Their socials are scattered. A scout, teammate, or org can't quickly evaluate a player from one link. RankCard fixes this.

The product delivers one URL — `rankcard.gg/alexg` — that answers every relevant question about a competitive player in under 10 seconds.

---

## Who Uses This

**Primary user — the competitive player:**
Semi-pro and serious ranked players (Diamond+). They want to showcase their rank, team history, and socials in one place. They put the URL in their Discord bio, Twitter bio, and anywhere else they have a presence. They care deeply about how this looks — it represents them competitively.

**Secondary user — the scout or org manager:**
Looking to recruit players. They land on profiles to evaluate rank, role, availability, and competitive history. They need data to be verified and trustworthy, not self-reported.

**Tertiary user — the casual viewer:**
Teammates, community members, fans clicking a link. They want a quick read on who this person is.

---

## The Core Product Loop

```
Player signs up via Discord OAuth
       ↓
Connects Riot account (covers LoL + Valorant)
       ↓
Connects Faceit account (CS2 ELO)
       ↓
Fills in profile (role, bio, team history, socials)
       ↓
Publishes at rankcard.gg/{slug}
       ↓
Shares URL everywhere → scouts, teammates, tournament brackets find them
```

---

## The Six Questions Every Profile Must Answer

Every design and architecture decision should serve these six questions:

1. **Who are you?** — Name, gamertag, nationality, role, one-line bio
2. **How good are you?** — Live verified rank from game APIs, tamper-proof
3. **What have you done?** — Team history, tournaments, notable results
4. **What do you play?** — Games, roles, agents/champions
5. **Are you available?** — Status flag: On a team / Open to offers / Not looking
6. **How do I reach you?** — Discord, Twitch, Twitter, YouTube, OP.GG

---

## MVP Scope

### What IS in the MVP

- Discord OAuth login (identity layer)
- Profile builder (step-by-step, 5 steps)
- Riot API integration — LoL rank + Valorant rank (one OAuth covers both)
- Faceit API integration — CS2 ELO
- Public profile page at `rankcard.gg/{slug}`
- Landing page with live demo
- Rank auto-refresh every 30 minutes via background Worker
- Custom slug selection on publish
- Mobile-responsive design throughout

### What is NOT in the MVP (do not build these)

- Scout search or recruitment marketplace
- Org/team dashboards
- Analytics or profile view counts
- Custom domains (e.g. `alexg.gg`)
- Messaging between users
- Discord bot
- Leaderboards
- Notifications
- Premium/paid tiers (design for it, don't build it yet)
- Apex Legends, Overwatch, Rocket League (v2 — Riot + Faceit is enough for MVP)

---

## Pages & Routes

```
/                          Landing page
/login                     Discord OAuth redirect
/auth/callback             Discord OAuth callback handler
/onboarding                Profile builder (multi-step)
/dashboard                 Player's own profile management
/[slug]                    Public profile page (e.g. /alexg)
/api/auth/discord          Auth endpoints
/api/profile               Profile CRUD
/api/connect/riot          Riot OAuth flow
/api/connect/faceit        Faceit connection flow
/api/ranks/refresh         Manual rank refresh trigger
```

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** — strict mode, no any
- **Tailwind CSS v4** — utility-first, no component libraries
- **Framer Motion** — page transitions and micro-animations
- **Fonts:** Rajdhani (headings, gamertag, rank display) + Inter (body, UI) via `next/font`

### Backend
- **Next.js API routes** — all server logic
- **@opennextjs/cloudflare** — adapter to run Next.js on Cloudflare Workers

> ⚠️ CRITICAL: Do NOT use `@cloudflare/next-on-pages` — it is deprecated. Use `@opennextjs/cloudflare` deployed to Cloudflare **Workers** (not Pages). Reference: https://opennext.js.org/cloudflare

### Infrastructure (all Cloudflare)
- **Cloudflare Workers** — Next.js runtime via OpenNext adapter
- **Cloudflare D1** — primary database (SQLite, serverless, edge)
- **Cloudflare KV** — rank data cache (30-minute TTL), session storage
- **Cloudflare R2** — avatar image storage
- **Wrangler** — local development and deployment CLI

### CI/CD
- **GitHub** — source control
- **GitHub Actions** — CI pipeline
  - On push to `main`: run typecheck + lint → `wrangler deploy`
  - On PR: typecheck + lint only (no deploy)
- Secrets stored in GitHub Actions secrets + Cloudflare environment variables

### Dev tooling
- **pnpm** — package manager
- **ESLint** + **Prettier** — code quality
- **Wrangler** for local dev with D1/KV/R2 bindings

---

## Infrastructure Architecture

```
User request
     ↓
Cloudflare Edge (330+ cities)
     ↓
Cloudflare Worker (Next.js via OpenNext)
     ├── D1 Database (profile data, game connections, team history)
     ├── KV Store (rank cache, sessions)
     └── R2 Bucket (avatar images)
          ↓
External APIs (on-demand or via scheduled Worker)
     ├── Riot API (LoL rank, Valorant rank)
     └── Faceit API (CS2 ELO)
```

### Scheduled rank refresh
A separate Cloudflare Worker cron job runs every 30 minutes. It queries D1 for all profiles with connected game accounts, fetches fresh rank data from Riot/Faceit APIs, and writes results back to D1 and KV cache. This way the public profile page always reads from cache — fast, no API latency on page load.

---

## Database Schema (D1 — SQLite)

Design the full schema yourself, but it must cover these entities:

**users** — Discord identity (discord_id, username, discriminator, avatar_url, access_token, refresh_token, created_at)

**profiles** — Player profile (user_id FK, slug UNIQUE, display_name, country, tagline, bio, status enum[on_team|open|not_looking], is_published, published_at, updated_at)

**game_connections** — Connected game accounts (profile_id FK, game enum[lol|valorant|cs2], account_id, account_name, rank_tier, rank_division, lp_rr, queue_type, last_refreshed_at)

**social_links** — Social profiles (profile_id FK, platform enum[discord|twitch|twitter|youtube|opgg|tracker], handle_or_url)

**team_history** — Competitive history (profile_id FK, org_name, role, game, start_date, end_date, result_note, display_order)

**roles_played** — Games and roles (profile_id FK, game, role, is_main)

---

## Auth Flow

```
1. User clicks "Login with Discord"
2. Redirect to Discord OAuth2 (scopes: identify, email)
3. Discord redirects to /auth/callback with code
4. Exchange code for access_token + refresh_token
5. Fetch user profile from Discord API
6. Upsert user in D1
7. Create session token → store in KV with 7-day TTL
8. Set httpOnly cookie with session token
9. Redirect to /onboarding (new user) or /dashboard (returning)
```

Session validation: middleware reads cookie → validates against KV → attaches user to request context.

---

## Riot API Integration

Riot provides a single OAuth (RSO — Riot Sign On) that covers both League of Legends and Valorant under one account connection.

**Flow:**
1. Player clicks "Connect Riot Account"
2. Redirect to Riot SSO OAuth
3. Callback with authorization code
4. Exchange for Riot access token
5. Call `/riot/account/v1/accounts/me` → get PUUID + Riot ID
6. For LoL: Call `/lol/summoner/v4/summoners/by-puuid/{puuid}` → get summoner, then `/lol/league/v4/entries/by-summoner/{summonerId}` → get rank
7. For Valorant: Call Valorant ranked API with PUUID → get current act rank
8. Store rank data in D1 game_connections, cache in KV

**Important:** Apply for a Riot production API key — the dev key has very low rate limits (20 requests/second, 100/2 minutes). Store the API key in Cloudflare Worker environment secrets via Wrangler.

---

## Faceit API Integration

Faceit is the most accurate source for CS2 competitive ELO (Valve's own rank system is less reliable).

**Flow:**
1. Player enters their Faceit username (no OAuth needed for read — just a public API call)
2. Call `https://open.faceit.com/data/v4/players?nickname={username}`
3. Extract `games.cs2.faceit_elo` and `games.cs2.skill_level`
4. Map skill level (1-10) to rank label (Silver → Global equivalent)
5. Store in D1 game_connections

Store Faceit API key in Worker environment secrets.

---

## Design Requirements

This is the most critical section. The frontend must be exceptional. This is a product competitive players will use to represent their identity — it must look and feel like a real esports product, not a generic SaaS tool.

### Aesthetic Direction

**Dark, professional, esport-native.** Think: the design language of Riot Games client, Valorant menus, League client — clean dark surfaces, sharp typography, intentional colour use. Not flashy or gimmicky. Confident and precise.

**NOT:** purple gradients on white, generic card shadows, Inter-on-white startup look, anything that looks like a template.

### Colour System

```
Background layers:
  --bg-base:     #07070f   (page background)
  --bg-surface:  #0f0f1c   (cards, panels)
  --bg-elevated: #161625   (hover states, inputs)
  --bg-subtle:   #1e1e30   (dividers, subtle fills)

Borders:
  --border-subtle:  rgba(255,255,255,0.06)
  --border-default: rgba(255,255,255,0.10)
  --border-strong:  rgba(255,255,255,0.18)

Text:
  --text-primary:   #f0f0f8
  --text-secondary: #8888a8
  --text-muted:     #44445a

Accent (use sparingly):
  --accent:       #534AB7   (primary CTA, links)
  --accent-light: #7b72d4

Rank colours (semantic, used for rank display only):
  Iron / Bronze:  #BA7517
  Silver:         #888799
  Gold:           #C9A227
  Platinum:       #0F8A6A
  Emerald:        #1AAD8A
  Diamond:        #2A7FBF
  Master:         #9D48E0
  Grandmaster:    #C93030
  Challenger:     #D4AF37
  Immortal:       #9D48E0
  Radiant:        #E8B84B
  Global Elite:   #D4AF37
```

### Typography

```
Display / gamertags / rank names:
  font-family: 'Rajdhani', sans-serif
  weights: 600, 700
  tracking: 0.03em–0.08em

Body / UI / labels:
  font-family: 'Inter', sans-serif
  weights: 400, 500
  line-height: 1.6

Monospace (slugs, IDs):
  font-family: 'JetBrains Mono', monospace
```

### Component Design Principles

- Cards: `background: var(--bg-surface)`, `border: 1px solid var(--border-subtle)`, `border-radius: 10px`
- On hover: border transitions to `var(--border-default)`, subtle `translateY(-1px)`
- No box-shadows — use border colour changes for elevation
- Buttons: primary uses `--accent`, secondary is ghost with border, never filled grey
- Inputs: `background: var(--bg-elevated)`, subtle border, no white backgrounds
- Rank tier pills: coloured text on dark background using rank colour system above
- Nationality flags: use emoji flags, don't overengineer
- Status badges: "Open to offers" = green dot + text, "On a team" = blue, "Not looking" = muted

### Animations

- Page transitions: fade + slight upward translate (Framer Motion)
- Profile load: staggered section reveals (0.1s delay between sections)
- Rank card hover: subtle scale 1.02 + border brighten
- Step-by-step builder: slide transitions between steps
- Connection success: brief green flash on the game icon
- Keep all animations under 300ms. No bouncing, no spring physics on UI elements.

### Mobile-First

Design mobile first. Most players will share the link from their phone and viewers will open it on mobile. The public profile page (`/[slug]`) must look perfect at 390px wide before it looks good at 1280px.

Profile page mobile layout:
- Avatar + name + badges stack vertically and centre-aligned
- Rank cards full width, single column
- Social links full width buttons
- Team history list view

### Landing Page

The landing page has one job: make a player want to create a profile immediately.

- Hero: Large headline, a live rotating demo of a real profile card, single CTA button
- Social proof: "Used by players in X countries" (start with Cyprus + Greece)
- Demo section: show the profile page inline — let them interact with it before signing up
- How it works: 3 steps, icons, minimal copy
- Footer: minimal — logo, GitHub link (open source later), tagline

The landing page should feel like a game client loading screen — dark, sharp, confident. Not a SaaS marketing page.

---

## Slug System

- Slugs are unique, URL-safe, 3–24 characters
- Allowed: `a-z`, `0-9`, `-`, `_`
- Reserved slugs: `api`, `auth`, `admin`, `dashboard`, `onboarding`, `login`, `logout`, `settings`, `support`, `about`, `blog`, `pricing`
- On profile creation, suggest slug from Discord username (sanitised)
- Real-time availability check via API as user types (debounced 300ms)
- Show green tick or red X inline — no form submit to check

---

## Key Business Rules

- One profile per Discord account
- Rank data is always fetched from official APIs — never self-reported rank
- Profiles are private by default until player explicitly publishes
- Published profiles are public — no login required to view
- Players can unpublish (profile returns to private, URL returns 404)
- Rank auto-refreshes every 30 minutes via cron Worker
- Player can manually trigger a refresh once every 5 minutes (rate limit enforced in KV)
- If API is down or rate-limited, show last known rank with "Last updated X ago" label
- Game connection can be disconnected — rank section hides gracefully
- Deleted account removes all data including profile (GDPR consideration — add data deletion endpoint)

---

## Environment Variables & Secrets

These must be configured in Cloudflare Worker environment + `.dev.vars` locally:

```
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_REDIRECT_URI

RIOT_API_KEY
RIOT_CLIENT_ID           (for RSO OAuth)
RIOT_CLIENT_SECRET

FACEIT_API_KEY

SESSION_SECRET           (for signing session tokens)

# Cloudflare bindings (configured in wrangler.toml, not env vars)
DB                       (D1 database binding)
KV                       (KV namespace binding)
BUCKET                   (R2 bucket binding)
```

---

## wrangler.toml Structure

```toml
name = "rankcard"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "rankcard-db"
database_id = "YOUR_D1_ID"

[[kv_namespaces]]
binding = "KV"
id = "YOUR_KV_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "rankcard-assets"

[triggers]
crons = ["*/30 * * * *"]   # Rank refresh every 30 minutes
```

---

## GitHub Actions CI/CD

Two workflows:

**`ci.yml`** — runs on every PR:
```
- Checkout
- Setup pnpm
- Install dependencies
- TypeScript typecheck (tsc --noEmit)
- ESLint
- Build check (next build)
```

**`deploy.yml`** — runs on push to main:
```
- All CI steps above
- npx wrangler deploy (using CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID secrets)
- Run D1 migrations if any
```

Secrets needed in GitHub:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

---

## Project Structure

Suggest a clean structure following Next.js App Router conventions. At minimum:

```
/app
  /[slug]           Public profile page
  /dashboard        Authenticated player dashboard
  /onboarding       Profile builder
  /api              API routes
  layout.tsx        Root layout with fonts + providers
  page.tsx          Landing page

/components
  /profile          Profile display components
  /builder          Onboarding step components
  /ui               Reusable primitives (Button, Input, Badge etc.)

/lib
  /db               D1 query helpers
  /api              Riot, Faceit API clients
  /auth             Session + Discord OAuth helpers
  /utils            Rank formatting, slug validation etc.

/types              TypeScript interfaces

wrangler.toml
```

---

## Your Task

**Do not start writing code immediately.**

First, produce a complete coding plan that covers:

1. Project initialisation steps (exact commands to scaffold Next.js + OpenNext Cloudflare)
2. D1 schema — full SQL migration file
3. File-by-file implementation order (what to build first, why)
4. The auth middleware approach for protecting routes
5. How you'll handle the Riot OAuth flow given Cloudflare Workers constraints
6. The rank refresh cron Worker architecture
7. How R2 avatar upload will work (presigned URL or direct Worker upload)
8. Any constraints or gotchas you anticipate with the OpenNext + Cloudflare Workers setup
9. Frontend component hierarchy for the public profile page
10. Estimated complexity per section

After the plan is approved, implement section by section starting with:
- Project scaffold + wrangler config
- D1 schema + migrations
- Discord OAuth auth flow
- Then the rest in logical order

Ask for clarification if any requirement is ambiguous before building.

---

## Reference

The public profile page has already been designed. It includes:
- Header with avatar, gamertag, team badge, country, role tags, availability status
- Live Ranks section (rank tier coloured by game + tier, LP/RR badge, queue type)
- Competitive History section (org logo, role, game, year, result badge)
- Social Links section (Discord, Twitch, Twitter, OP.GG as styled link buttons)
- Games section (icon grid of games played)
- Footer CTA to create their own profile

The design language is: dark background (#07070f), surface cards (#0f0f1c), Rajdhani for names and ranks, Inter for body, rank-specific colours for tier display, subtle borders, no drop shadows.

This is the most important output of the MVP — if the public profile page looks average, the product fails. Players will only share something they're proud of.
