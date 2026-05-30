# ProCard.gg

Verified esports identity platform. One link with **live verified ranks**, team & match history, socials, and engagement — built for competitive players, coaches, and scouts. Think Linktree, but with live Riot API rank data and a card scouts actually trust.

**Status:** MVP in active development. Full feature set working locally; Cloudflare deployment target is wired but not yet shipped.

---

## Features

### Public card — `procard.gg/{slug}`

- **Live verified ranks** for League of Legends, Valorant, TFT (Riot) and CS2 (Faceit), colour-coded by tier with LP/RR.
- **Team & match history** — orgs, tournaments, roles, results.
- **Socials** — Twitch, YouTube, Kick, X, Instagram, TikTok, Discord, Liquipedia, OP.GG, Tracker.gg, website.
- **Markdown bio** — inline subset (`**bold**`, `*italic*`, `~~strike~~`, `` `code` ``, links) rendered safely.
- **Engagement** — views, likes, and an **Endorsements** section (signed-in vouches), shown below the card.
- **Static background, scrolling card**, banner, avatar, role/country/status badges, verified mark.

### Dashboard — split editor + live phone preview on every tab

- **Editor** — identity, availability/visibility, game accounts, team history, socials.
- **Appearance** — banner & background (house default, presets, or custom upload).
- **Analytics** — views (24h / last hour), who's viewing you by role (+ premium identity teaser), recent activity, viewer geography, and link clicks by platform.
- **Auto-save** — edits persist on blur; no save buttons. A sticky iPhone-style preview mirrors changes live.

### Connections & imports

- **Riot** — connect via RSO OAuth or a manual Riot ID (`Name#TAG`), with an 11-region picker.
- **CS2 / Faceit** — connect by Faceit nickname.
- **Multi-account** per game, with per-account show/hide and one-click **rank refresh**.
- **Bulk import** — pull every linked LoL account from a [lolpros.gg](https://lolpros.gg) profile.
- **Leaguepedia import** — pull team/match history from a Leaguepedia player page.

### Platform

- **Discord OAuth** login (stateless HMAC-signed `procard_session` cookie).
- **Image uploads** — avatar, banner, custom background (key-based blob storage; R2 in prod).
- **18 esports roles** — player, coach, analyst, scout, manager, caster, content creator, and more.
- **Marketing site** — landing page with hero, gallery, comparison, use cases, and a "who scouts you" scenario.

---

## Tech stack

| Layer         | Tech                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack)                                        |
| Language      | TypeScript (strict)                                                       |
| UI            | React 19, Tailwind CSS v4 (`@theme` tokens), Framer Motion                |
| Icons         | lucide-react + react-icons                                                |
| Database      | better-sqlite3 (local dev) → Cloudflare D1 (prod)                         |
| Auth          | Discord OAuth2 → stateless HMAC-signed cookies                            |
| External APIs | Riot (RSO + Data), Faceit, lolpros.gg, Leaguepedia                        |
| Deploy target | Cloudflare Workers + D1 + R2 + KV via `@opennextjs/cloudflare` + Wrangler |
| Tooling       | ESLint, Prettier, Husky + lint-staged, GitHub Actions CI                  |

---

## Local development

This project uses **pnpm**.

```bash
# Install
pnpm install

# Secrets — copy and fill in
cp .dev.vars.example .dev.vars     # Cloudflare/Wrangler runtime
# next dev also reads .env.local for the same keys

# Run the dev server
pnpm dev                           # → http://localhost:3000

# Quality gates (what CI runs)
pnpm typecheck
pnpm lint
pnpm build
```

### Required environment variables

See `.dev.vars.example` for the full list. At minimum:

- `SESSION_SECRET`
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` / `DISCORD_REDIRECT_URI`
- `RIOT_CLIENT_ID` / `RIOT_CLIENT_SECRET` / `RIOT_API_KEY` / `RIOT_REDIRECT_URI`

### Database

Local dev uses SQLite via `better-sqlite3` (stored under `.wrangler/state/`). Schema lives in `migrations/` (`0001`–`0010`). Production uses Cloudflare D1 — apply migrations with `pnpm db:migrate:local` / `pnpm db:migrate:remote`. Delete the local DB file to reset (you'll need to re-login and re-onboard).

### Scripts

| Script                              | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `pnpm dev`                          | Next dev server (Turbopack)                        |
| `pnpm build`                        | Production build                                   |
| `pnpm typecheck`                    | `tsc --noEmit`                                     |
| `pnpm lint`                         | ESLint                                             |
| `pnpm preview`                      | Build worker + `wrangler dev` (Cloudflare preview) |
| `pnpm deploy`                       | Build worker + `wrangler deploy`                   |
| `pnpm db:migrate:local` / `:remote` | Apply D1 migrations                                |

---

## Project structure

```
app/
  page.tsx              Marketing landing page
  login/                Discord OAuth login
  onboarding/           5-step profile builder
  dashboard/            Editor · Appearance · Analytics (split view + live preview)
  [slug]/               Public profile card
  auth/callback/        Discord OAuth callback
  api/
    auth/               discord · me · logout
    connect/            riot (+callback) · lolpros · leaguepedia
    profile/            CRUD, slug, socials, roles, team-history, connections (+visibility),
                        avatar, banner, background, and [slug]/{view,like,comments,social-click}
    ranks/refresh/      Manual rank refresh
  icon.png · apple-icon.png · opengraph-image.png · twitter-image.png

components/
  marketing/            Landing sections (Hero, Gallery, Comparison, ScoutScenario, …)
  builder/              Onboarding steps (Step1–Step5 + shell)
  dashboard/            DashboardShell, tabs, editor cards, LivePreview, analytics
  profile/              Public card (header, live ranks, history, socials, engagement, comments)
  ui/                   Primitives (Button, Input, Badge, RankEmblem, MiniMarkdown, logos, …)

lib/
  api/                  riot · riot-regions · lolpros · leaguepedia
  auth/                 discord · session (HMAC) · visitor
  db/                   client + query helpers (profiles, users, game-connections,
                        social-links, team-roles, engagement)
  constants/            esports-roles · backgrounds · demo-profiles
  utils/                rank · slug · country · color · time · esports-roles · lol-roles

migrations/             0001–0010 SQL migrations
public/                 brand · games · ranks · demo assets
scripts/export-brand.mjs   Brand asset export helper
docs/brand-assets.md       Brand asset reference
procard-brand-guidelines.md  Full brand spec (colours, fonts, spacing, voice)
```

---

## Design system

Dark-first esports aesthetic. Border-only elevation (no drop shadows), no emojis as icons.

- **Accent:** `#534AB7` / `#7b72d4`
- **Rank colours:** tiered from Iron through Challenger / Radiant
- **Fonts:** Rajdhani (display), Inter (body), JetBrains Mono (mono)
- **Cards:** 10px radius, border transitions on hover
- **Animations:** ≤ 300ms, no spring physics

Full spec in [`procard-brand-guidelines.md`](./procard-brand-guidelines.md).

---

## Notes & gotchas

- **Auth is stateless** — HMAC-signed `procard_session` cookie; no server session store.
- **Riot regions matter** — ranks resolve per region; the picker is required (a player on EUNE shows Unranked if queried against EUW).
- **No emojis as icons** — games and platforms use brand marks / styled labels by design.
- **Tailwind v4** — `@theme` tokens in `globals.css`; there is no `tailwind.config.js`.
- **Imports are not ownership-verified** — lolpros/Leaguepedia data is imported as-is and labelled accordingly.
