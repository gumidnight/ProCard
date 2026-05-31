# CLAUDE.md — ProCard.gg

> Operating guide for AI sessions on this repo. Read this first. It captures the
> **current state, the non-obvious gotchas, and the hard blockers** so each new
> session keeps the ball moving instead of re-discovering the same things.
>
> Last full audit: **2026-05-30** (see [docs/cloudflare/](docs/cloudflare/)).

---

## 1. What ProCard is

A **verified esports identity platform** — "Linktree for competitive players,
coaches, scouts, analysts, orgs". A public card at `procard.gg/{slug}` shows
**live verified ranks** (Riot LoL/Valorant/TFT, Faceit CS2), team/match history,
socials, a markdown bio, and engagement (views/likes/comments/endorsements).
Owners edit via a dashboard (split editor + live phone preview) after a 5-step
onboarding. Premium roadmap: **"who scouts you"** analytics (see auto-memory
`analytics_feature.md`).

## 2. Stack (do NOT rewrite these — improve them)

| Layer            | Tech                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------- |
| Framework        | **Next.js 16** App Router (Turbopack), **React 19**, TypeScript strict                      |
| Styling          | Tailwind v4 (`@theme` tokens in `globals.css`, no `tailwind.config.js`), Framer Motion      |
| Auth             | Discord OAuth2 → **stateless HMAC-signed `procard_session` cookie** (no server store)       |
| Data (now)       | **better-sqlite3** (synchronous, local file under `.wrangler/state`)                        |
| Data (target)    | **Cloudflare D1** (async binding) — _not yet implemented_                                   |
| Storage (now)    | **node:fs** under `.wrangler/state` — _Workers-incompatible_                                |
| Storage (target) | **Cloudflare R2** (`BUCKET` binding declared, **never used in code**)                       |
| Deploy           | `@opennextjs/cloudflare` → **single Cloudflare Worker** (Workers + static assets), Wrangler |
| External         | Riot (RSO OAuth + Data API), Faceit, lolpros.gg, Leaguepedia                                |

## 3. ✅ Deploy-blocker status (as of 2026-05-31)

Phases 1–5 have been implemented. The P0 deploy blockers are **resolved**:

- ✅ D1 adapter layer — `lib/db/adapter.ts` (getCloudflareContext → D1 or SQLite fallback)
- ✅ All `lib/db/*` helpers are async and use the adapter
- ✅ All route callers `await` the async DB calls
- ✅ `open-next.config.ts` exists
- ✅ `lib/storage.ts` (R2 via BUCKET binding or local-disk fallback) + upload routes rewritten
- ✅ `wrangler.toml` has env separation ([env.staging] / [env.production]) and bumped compatibility_date
- ✅ `ensureMigrated()` is a no-op stub
- ✅ Cron trigger declared (handler still TBD — deploy placeholder exists)

**What still needs real CF infrastructure before first deploy:**

- Create D1/KV/R2 resources via `wrangler d1 create` etc. and paste real IDs into wrangler.toml
- Set secrets via `wrangler secret put --env production` (see docs/cloudflare/INFRASTRUCTURE.md §6)
- `wrangler d1 migrations apply procard-db-prod --remote --env production` before first deploy
- GitHub Environments (`staging`, `production`) configured with required reviewers for CI/CD gate

See ROADMAP.md for the cron scheduled handler (Phase 3 scale work).

## 3b. ⛔ The thing you must now internalise: INFRASTRUCTURE MUST BE PROVISIONED

The README says the CF target is "wired but not yet shipped." That undersells it.
**The bindings in `wrangler.toml` (D1/KV/R2) are declared but never consumed by any
code.** Everything goes through Node `better-sqlite3` + `fs`. Grep proof:
`getCloudflareContext`, `env.DB`, `env.BUCKET`, `scheduled(` → **zero matches in
source** (only a comment in [lib/db/client.ts](lib/db/client.ts#L7)).

**Six P0 deploy/run blockers** (full detail in [docs/cloudflare/AUDIT.md](docs/cloudflare/AUDIT.md)):

1. **Data layer is synchronous `better-sqlite3`** (native addon + local file). Cannot
   load on workerd. ~40 helpers in `lib/db/*` + ~25 call sites must become **async D1**. **(XL)**
2. **Image uploads use `fs.writeFileSync`** ([avatar](app/api/profile/avatar/route.ts), banner, background) → must become **R2** (`env.BUCKET.put`). **(M–L)**
3. **No root `open-next.config.ts`** → `build:worker`/`deploy` fail. **(S)**
4. **`wrangler.toml` has placeholder IDs** (`database_id="local"`, KV `id="local"`) and **no `[env.*]` separation**. **(M)**
5. **`*/30` cron has no `scheduled()` handler** → the headline live-rank refresh never runs. **(M–L)**
6. **`ensureMigrated()` does `fs.readdirSync` on every DB call** → throws on Workers; remove it, use `wrangler d1 migrations apply`. **(S)**

## 4. 🔴 Security blockers (fix before any public launch)

These ship and "run" fine but expose users. Full fixes in [docs/cloudflare/SECURITY.md](docs/cloudflare/SECURITY.md).

- **3× Critical IDOR / broken object-level auth** — any logged-in user can delete/modify
  **anyone's** data by passing a row `id` with no ownership scoping:
  - [connections DELETE](app/api/profile/connections/route.ts#L52) + [riot DELETE](app/api/connect/riot/route.ts#L176) → `deleteGameConnectionById(id)` ([no `profile_id`](lib/db/game-connections.ts#L183))
  - [connection visibility PATCH](app/api/profile/connections/visibility/route.ts#L9) — doesn't even load the caller's profile
  - [team-history DELETE/POST](app/api/profile/team-history/route.ts#L98) → upsert/delete by `id` only
  - **Fix:** scope every by-id mutation with `AND profile_id = ?` (or fetch-and-check). Comments claiming "Ownership validated" are **false**.
- **OAuth tokens stored plaintext** (Discord + Riot access/refresh) — [migrations/0001](migrations/0001_initial_schema.sql#L19). Encrypt at rest or stop persisting. `refreshRsoToken` is dead code.
- **No rate limiting** on anonymous `view`/`like`/`comment`/`social-click` → metric inflation + D1 write-cost DoS. Visitor cookie is unsigned/forgeable.
- **No security headers** anywhere (no CSP/HSTS/X-Frame-Options/Referrer-Policy/nosniff).
- **Impersonation:** manual Riot-ID / lolpros / Leaguepedia imports attach _anyone's_ identity with no ownership proof, returned indistinguishably from RSO-verified — contradicts "verified" positioning.

### ✅ What is already done RIGHT (don't "fix" these, don't regress them)

- OAuth CSRF `state` **is** generated and validated (Discord + Riot callbacks).
- `MiniMarkdown` is **XSS-safe** (React nodes, scheme-restricted hrefs, no `dangerouslySetInnerHTML` anywhere in app code).
- Session HMAC uses `crypto.timingSafeEqual`; `SESSION_SECRET` has no insecure fallback.
- All SQL is **parameterised** (no value injection). `social_links`/`roles_played` use race-free `ON CONFLICT` upserts.
- PATCH `/api/profile` allow-list deliberately excludes `is_verified`/`is_pro`/`banner_key` (no self-verify/upgrade).
- Comment DELETE authz is correct (author-or-owner). `social-click` checks link ownership. Slug validation is strict.
- Schema is well-normalised, INTEGER booleans + `unixepoch()` + UUID PKs → **D1-friendly**.

## 5. Target architecture (one line)

Single **OpenNext Worker** → **D1** (core data) + **R2** (assets via `cdn.procard.gg` + Cache Rules)

- **KV** (rank/profile cache, rate-limit counters) + **Queues + Durable Objects** (rank refresh
  producer/consumer & Riot rate-limiter) + **Workers Analytics Engine** (engagement events, keeps D1
  under the 10 GB cap) + **WAF rate limiting / Turnstile** (abuse). Full design:
  [docs/cloudflare/TARGET-ARCHITECTURE.md](docs/cloudflare/TARGET-ARCHITECTURE.md).

> **Note on "Pages":** a Next.js App Router app with SSR + middleware + API routes does **not**
> split cleanly into Pages(static)+Workers(API). The correct CF-native model here is the
> **OpenNext Worker serving SSR + static assets** (assets are edge-cached exactly like Pages).
> Treat "Pages for the frontend" as satisfied by the Worker's static-asset handling.

## 6. Don't-break-it scale rules (the design breaks ~10k–100k users without these)

- **Never** refresh every connection every 30 min (Riot rate limits + 6-concurrent-connections + 15-min cron wall-clock + D1 writes). Cron = **producer only** → Queue. Prefer **lazy refresh-on-view with a TTL**.
- **Never** write one D1 row per profile view. Use **Analytics Engine** for events + **denormalized counters** (DO or batched) for live counts. D1 single-DB cap is **10 GB, not increasable**; per-view rows fill it in weeks.
- **Don't** `COUNT(*)` per request — keep `view_count`/`like_count` columns.
- **Cache** the public profile HTML at the edge; move per-viewer bits (liked/owner/view-ping) client-side so the page isn't forced fully-dynamic by `cookies()`.
- Add **timeouts** (`AbortSignal.timeout`) + **429/Retry-After backoff** to every Riot fetch.

## 7. Conventions & gotchas

- **pnpm** only. Quality gates = `pnpm typecheck && pnpm lint && pnpm build` (what CI runs).
- UUIDs via `crypto.randomUUID()` in app code; booleans = INTEGER 0/1; timestamps = `unixepoch()` seconds.
- **No emojis as icons** (brand rule). Border-only elevation, no drop shadows, animations ≤300ms. See `procard-brand-guidelines.md`.
- Riot **region matters** — ranks resolve per region. The RSO callback currently **hardcodes `na1`** ([bug](app/api/connect/riot/callback/route.ts#L71)).
- Tailwind v4: tokens live in `app/globals.css` `@theme`, not a config file.
- Secrets: `lib/env.ts` lazy getters; `env()` throws if missing. Local secrets in `.dev.vars` (gitignored). `LEAGUEPEDIA_BOT_USER`/`PASS` are read raw from `process.env` and are **undocumented** — add to `.dev.vars.example`.

## 8. Roadmap pointer

Implementation is phased in [docs/cloudflare/ROADMAP.md](docs/cloudflare/ROADMAP.md). Order of battle:
**(P1)** unblock deploy (D1 + R2 + open-next config + envs) → **(P2)** security blockers (IDOR, headers, rate limits, tokens) →
**(P3)** scale (cron→queue, engagement→AE, edge cache) → **(P4)** CI/CD gates + tests → **(P5)** launch hardening.

**Do not start the D1 async migration without tests in place first** ([docs/cloudflare/CICD-AND-TESTING.md](docs/cloudflare/CICD-AND-TESTING.md)) — it touches every read path and there is currently **zero test coverage**.
