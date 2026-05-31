# ProCard.gg — Codebase Audit (Phase 1)

_Audit date: 2026-05-30. Method: full read of `app/`, `components/`, `lib/`, `migrations/`,
infra/config, cross-checked against live Cloudflare platform docs._

Severity scale (rated for **"public launch on Cloudflare at hundreds-of-thousands-of-users
scale"**): **Critical** = blocks deploy/run or mass-exposes users · **High** = serious before
launch · **Medium** = fix during hardening · **Low/Info** = opportunistic.

Effort: **S** <1d · **M** 1–3d · **L** 1–2wk · **XL** >2wk.

---

## 1. Executive summary

ProCard is a well-structured Next.js 16 / React 19 app with a clean, normalised data model,
solid auth primitives (timing-safe HMAC sessions, validated OAuth CSRF state), and a genuinely
XSS-safe rendering layer. The product thinking is sound and the toolchain is modern.

**But it cannot run on Cloudflare today, and it is not yet built for the stated scale.** The
D1/KV/R2 bindings declared in `wrangler.toml` are **never used by any code** — the entire data
layer is synchronous `better-sqlite3` against a local file, and image uploads use `node:fs`,
neither of which exists on the Workers runtime. There is no `open-next.config.ts`, the cron
trigger has no handler, and `wrangler.toml` ships placeholder resource IDs with no
environment separation. On top of those **six P0 deploy blockers** sit **three Critical IDOR
vulnerabilities** (any authenticated user can delete/alter anyone's data), plaintext OAuth
token storage, and a complete absence of rate limiting and security headers.

The good news: none of this is a dead end. The schema is D1-compatible, the auth model fits a
stateless Worker, and the fixes are mostly mechanical (if pervasive). This is an
**improve-in-place** programme, not a rewrite.

**Headline numbers:** 6 P0 Cloudflare blockers · 3 Critical security (IDOR) · ~15 High ·
~18 Medium · zero automated tests.

---

## 2. Risk assessment (the matrix)

| #   | Risk                                                                                      | Sev      | Likelihood       | Category         | Effort |
| --- | ----------------------------------------------------------------------------------------- | -------- | ---------------- | ---------------- | ------ |
| R1  | Data layer is sync `better-sqlite3` native addon + local file — won't load on workerd     | Critical | Certain          | CF-blocker       | XL     |
| R2  | Image uploads/serves use `node:fs` (`.wrangler/state`) — throw on Workers; R2 unused      | Critical | Certain          | CF-blocker       | M–L    |
| R3  | No root `open-next.config.ts` — `build:worker`/`deploy` cannot package a runnable Worker  | Critical | Certain          | CF-blocker       | S      |
| R4  | `wrangler.toml` placeholder IDs (`"local"`) + no `[env.*]` — deploy binds nothing real    | Critical | Certain          | CF-blocker       | M      |
| R5  | `*/30` cron declared, **no `scheduled()` handler** — live-rank refresh never runs         | Critical | Certain          | CF-blocker       | M–L    |
| R6  | `ensureMigrated()` `fs.readdirSync` on every DB call — throws on Workers                  | High     | Certain          | CF-blocker       | S      |
| R7  | **IDOR**: delete/modify ANY user's game connections, visibility, team history by `id`     | Critical | High             | Security         | S–M    |
| R8  | OAuth tokens (Discord + Riot access/refresh) stored plaintext in D1                       | High     | Medium           | Security         | M–L    |
| R9  | No rate limiting on anonymous engagement endpoints → metric fraud + D1 write-cost DoS     | High     | High             | Security/Cost    | M      |
| R10 | No security headers (CSP/HSTS/X-Frame-Options/Referrer-Policy/nosniff)                    | High     | Medium           | Security         | S      |
| R11 | Impersonation: manual/imported connections attach anyone's identity, unverified-but-shown | High     | High             | Security/Product | M      |
| R12 | Cron "refresh all every 30 min" blows Riot limits + subrequest/CPU caps + D1 writes       | High     | Certain at scale | Scalability      | L      |
| R13 | Per-view D1 writes + `COUNT(*)` reads — write-cost killer, 10 GB cap, latency             | High     | Certain at scale | Scalability/Cost | L      |
| R14 | Public profile fully-dynamic, ~10–11 sequential D1 round-trips/view, no edge cache        | High     | Certain at scale | Performance      | L      |
| R15 | Riot client: no timeouts, no 429/Retry-After, no backoff, no cache                        | High     | Medium           | Perf/Scale       | M–L    |
| R16 | Zero automated tests before an app-wide sync→async D1 migration                           | Medium   | High             | TechDebt         | L      |
| R17 | No env separation / secret-management strategy / DR-backup plan                           | High     | —                | Ops              | M      |
| R18 | CI has no tests/audit/SAST/secret-scan/gated deploy                                       | High     | —                | Ops              | L      |

**Quick wins (high value / low effort):** R3, R6, R10, R7 (per-route fix is S each), signed
visitor cookie, RSO `secure:false`→env, drop redundant indexes, content-type magic-byte sniff.

**Critical blockers (no deploy without):** R1, R2, R3, R4, R5, R6.

**Security/launch blockers (no public launch without):** R7, R8, R9, R10, R11.

---

## 3. Findings by dimension

### 3.1 Cloudflare readiness — VERDICT: NOT DEPLOYABLE

- **[Critical] Sync `better-sqlite3` data layer.** `lib/db/client.ts` imports a native addon and
  opens a file at `process.cwd()/.wrangler/state/procard.db`. All 6 query modules + ~25 callers
  are synchronous; D1's binding API is async. Nothing calls `getCloudflareContext().env.DB`.
  → Replace with async D1; convert every helper + caller to `await`. **(XL)**
- **[Critical] `node:fs` image routes** (avatar/banner/background): `fs.writeFileSync`/`readFileSync`
  under `.wrangler/state`. Workers FS is read-only/ephemeral/per-isolate. R2 `BUCKET` declared, unused.
  → R2 `put`/`get`/`delete`; serve via CDN URL. **(M–L)**
- **[Critical] No root `open-next.config.ts`** (only the `node_modules` template) and
  `next.config.ts` never calls `initOpenNextCloudflareForDev()`. → add both. **(S)**
- **[Critical] `*/30` cron has no `scheduled()` handler** (grep: zero matches). The only refresh
  path is a session-gated POST scoped to the caller. → implement a producer handler. **(M–L)**
- **[High] `ensureMigrated()`** does `fs.readdirSync`+`db.exec` on first access, called atop every
  helper. → delete from runtime; rely on `wrangler d1 migrations apply`. **(S)**
- **[High] Placeholder IDs + stale `compatibility_date` (2024-09-23)** + no `[env.*]`. **(S–M)**
- **[Medium] Deploy model ambiguity** — README implies Pages; build is a single OpenNext Worker.
  Standardise on the Worker model. **(S)**

### 3.2 Database

- **[Critical]** Sync→async D1 migration (as above) — root blocker; cascades to ~25 call sites. **(XL)**
- **[High] Migration 0007** relies on `PRAGMA foreign_keys=OFF` inside a table rebuild — a **no-op
  inside D1's implicit per-migration transaction**. Local (better-sqlite3) and D1 behaviour
  diverge precisely on the trickiest migration; never validated on real D1. → test 0001–0010 fresh
  on remote D1; remove the no-op PRAGMA. **(S)**
- **[High] Engagement `COUNT(*)`** on every profile render + ~9–13 aggregate queries per analytics
  load; per-visitor rows kept forever; no rollup. → denormalised counters + rollups. **(L)**
- **[Medium]** In-app aggregation/N+1 in `countViewersByRole`/`findRecentActivity` (4 queries merged
  in JS). → push to SQL `GROUP BY` / `UNION ALL` / `db.batch()`. **(M)**
- **[Medium]** `esports_role` is a **comma-joined string** — unindexable, blocks the role-faceted
  "who scouts you" analytics. → normalise to `profile_roles` or a `primary_role` column. **(M)**
- **[Medium]** `updateProfile` interpolates **column names** verbatim — safe only by caller
  discipline. → move the allow-list inside the helper. **(S)**
- **[Medium]** No transactions around read-then-write upserts (`upsertUser`, `upsertGameConnection`,
  `toggleProfileLike`) — races on D1. → `INSERT … ON CONFLICT` / `db.batch()`. **(M)**
- **[High] Plaintext OAuth tokens** in `users` and `game_connections`. **(M–L)**
- **[Low]** Redundant single-column indexes duplicate the `UNIQUE(profile_id,visitor_id)` prefix —
  extra write cost on the hottest path. Unused `idx_gc_last_refreshed`. Hand-maintained `types/db.ts`
  drift; dead `peak_rank_*` columns.

### 3.3 API design & authorization

- **[Critical] IDOR pattern (broken object-level auth)** — the headline app-security defect:
  - `DELETE /api/profile/connections` & `DELETE /api/connect/riot` → `deleteGameConnectionById(id)`,
    `DELETE … WHERE id = ?` (no `profile_id`). Comments claim "ownership validated" — **false**.
  - `PATCH /api/profile/connections/visibility` → `setGameConnectionVisibilityById(id,…)`; route
    never loads the caller's profile at all.
  - `DELETE /api/profile/team-history` deletes by body `id`, no profile lookup; **POST** upserts into
    an attacker-chosen `id`, overwriting another user's row.
    → Scope every by-id mutation: `… WHERE id = ? AND profile_id = ?` (or fetch-then-verify). **(S–M)**
- **[High] No ownership proof** on manual Riot-ID / lolpros / Leaguepedia connect → impersonation;
  imported data returned indistinguishably from RSO-verified. **(M)**
- **[High] No rate limiting** on anonymous `view`/`like`/`social-click` (`recordSocialClick` has zero
  dedup). **(M)**
- **[Medium]** Weak input validation: no length caps on `display_name`/`tagline`/`status_note`; enum
  fields (`status`/`background_*`/`esports_role`/`country`) unvalidated; team-history free-text. **(M)**
- **[Medium]** PATCH/POST `/api/profile` rethrow non-UNIQUE errors → raw 500/info leak. **(S)**
- **[Low]** Upstream error strings echoed to clients; REST inconsistencies (logout POST→302, bulk POST
  returns 201, DELETE-with-body); no session revocation.
- ✅ Owner-mutating routes correctly resolve the caller's **own** profile; PATCH allow-list excludes
  `is_verified`/`is_pro`; comment DELETE authz is a model implementation; `social-click` checks link
  ownership.

### 3.4 Authentication & sessions

- **[High]** IDORs (above) are authorization failures. **[High]** `SESSION_SECRET` strength never
  validated (blank in example, `ci-dummy` in CI) — weak secret = forge any session. **[High]**
  plaintext tokens. **[Medium]** no session revocation (logout clears local cookie only; 7-day TTL
  uninvalidatable). **[Medium]** OAuth state not bound to session / no PKCE; Riot state cookie
  `secure:false`. **[Medium]** `secure` flag tied to `NODE_ENV` (fail-open). **[Low]** middleware checks
  cookie **presence** only; visitor cookie unsigned/forgeable; logout no CSRF. **[Info]** `email` scope
  - PII stored without stated need.
- ✅ Timing-safe HMAC, validated OAuth state (both flows), no open-redirect, no insecure secret fallback.

### 3.5 File storage

- **[Critical]** `fs` uploads (won't run) + **[Critical]** R2 binding unused (storage backend
  unimplemented). **[High]** assets streamed **through the Worker** (CPU/duration/egress cost) instead
  of CDN-fronted R2 URLs. **[High]** content-type trusts client `file.type` — no magic-byte sniffing
  (SVG/polyglot risk). **[Medium]** no image re-encode/resize/EXIF-strip (sharp unavailable; no
  Cloudflare Images/WASM fallback). **[Medium]** no upload rate limiting. **[Low]** orphan cleanup is
  best-effort/non-transactional.
- ✅ Path-traversal blocked on GET key; non-guessable per-profile keys; sane size caps; correct
  immutable Cache-Control intent.

### 3.6 External APIs (Riot / Faceit / lolpros / Leaguepedia)

- **[Critical]** cron has no handler; **[Critical]** all connect/refresh routes hit sync better-sqlite3.
- **[High]** Riot client: **no 429/Retry-After handling, no backoff** (Leaguepedia has it, Riot —
  the strictest-limit, highest-volume integration — doesn't). **[High]** **no request timeouts**
  anywhere (`AbortController` absent repo-wide) → hung upstream burns the invocation. **[High]** RSO
  tokens plaintext + never refreshed (`refreshRsoToken` is dead code). **[High]** rank refresh is
  unbounded sequential fan-out (a lolpros import = 10+ accounts = 20–40 serial subrequests). **[Medium]**
  RSO callback hardcodes `na1` → no rank for non-NA players. **[Medium]** imported data trusted/unsanitised
  (`org_logo_url` rendered as `<img src>`). **[Medium]** no rate limiting on connect endpoints (shared
  Riot key is a scarce global resource). **[Low]** Leaguepedia Cargo `where` clauses interpolate
  API-returned names with only quote-stripping.
- ✅ SSRF well-mitigated (slugs/titles validated, not raw URLs); robust Leaguepedia client (session
  cache, in-flight dedup, backoff); correct Riot regional/platform routing; defensive lolpros parsing.

### 3.7 Security (cross-cutting, OWASP)

- **[Critical]** A01 Broken Access Control (the IDORs). **[High]** A04 no rate limiting / abuse design.
  **[High]** A05 no security headers. **[High]** A02 plaintext tokens + email. **[Medium]** A03 unvalidated
  `current_team_logo_url` rendered as `<img src>` (beacon/tracking). **[Medium]** A01 no CSRF token /
  Origin check (only `sameSite=lax`). **[Low]** latent column-name injection in `updateProfile`; social
  `handle_or_url` stored without scheme check (mitigated by renderer); `/api/auth/me` returns `discord_id`.
- ✅ `MiniMarkdown` XSS-safe; all UGC React-escaped; no `dangerouslySetInnerHTML`/`eval`/`innerHTML`;
  strict slug validation; privilege fields excluded from self-edit.

### 3.8 Config / secrets / CI-CD

- **[Critical]** no `open-next.config.ts`; **[Critical]** placeholder IDs + no `[env.*]`.
  **[High]** no documented secret strategy (`wrangler secret put` vs `[vars]`); **[High]** CI is
  typecheck/lint/build only (no tests/audit/SAST/secret-scan/gated deploy); **[High]** `better-sqlite3`
  is a **production** dependency on the Worker path. **[Medium]** undocumented `LEAGUEPEDIA_BOT_*`
  secrets bypass `lib/env.ts`; **[Medium]** module-scope `process.env` reads are fragile on Workers;
  **[Medium]** no `packageManager`/`engines` pin; **[Medium]** floating caret deps, no Dependabot/audit.
  **[Low]** pre-commit secret-scan missing; APP_URL doc drift.
- ✅ `.gitignore` covers `.dev.vars`/`.env*`/`.wrangler`; no secrets committed; lockfile committed +
  `--frozen-lockfile`; strict TS; husky+lint-staged.

### 3.9 Frontend / performance / scalability / tech debt

- **[High]** public profile is **fully dynamic** (`cookies()` in render) with ~10–11 sequential DB
  round-trips and no ISR/edge cache. **[High]** per-view DB write path (write amplification).
  **[High]** "refresh all every 30 min" infeasible at scale. **[Medium]** `COUNT(*)`/`GROUP BY` full
  scans; whole public card is one `use-client` Framer-Motion tree; SSR view-count discarded by a client
  refetch; Riot has no cache/backoff. **[Medium]** **zero tests** despite Playwright installed;
  `ensureMigrated` on hot path. **[Low]** three icon/animation libs (framer-motion + lucide + react-icons);
  dead/deprecated code; demo `.find()` on every slug miss.
- ✅ Well-indexed schema; correct UNIQUE-based dedup; best-effort non-blocking event logging; cost-aware
  analytics product model; correct `images.unoptimized`.

---

## 4. What this means for the plan

The dependency order is forced: **you cannot deploy until R1–R6 are fixed**, and you should **not
start R1 (the sync→async D1 rewrite) without tests (R16) in place**, because it touches every read
path. Security blockers R7–R11 are cheap relative to their impact and several are quick wins. The
scale work (R12–R15) can land after a private launch but before any growth push. See
[ROADMAP.md](ROADMAP.md) for sequencing.
