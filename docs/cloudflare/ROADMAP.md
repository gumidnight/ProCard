# ProCard.gg — Execution Roadmap (Phase 8)

Sequenced so dependencies are respected: **you cannot deploy until P1**, and you should **not start
the D1 rewrite (the spine of P1) without the test harness from P0**. Effort: S <1d · M 1–3d · L 1–2wk
· XL >2wk. Calendar estimate assumes 1–2 engineers.

Legend: 🟢 quick win · 🔵 critical (deploy) blocker · 🔴 security/launch blocker.

---

## Phase 0 — Safety net & ground truth (≈1 week)

**Goal:** make the big refactor survivable; remove dead-on-Workers code; fix free wins.

- 🟢 Add `open-next.config.ts` + `initOpenNextCloudflareForDev()` (S) — **R3**
- 🟢 Remove `ensureMigrated()`/`migrateLocal()` from runtime path; rely on `wrangler d1 migrations apply` (S) — **R6**
- 🟢 Test harness: Vitest + `@cloudflare/vitest-pool-workers` + Playwright; `test:*` scripts; CI `test` job (M)
- 🟢 Write **IDOR + session-HMAC unit/integration tests FIRST** (they lock in P2 fixes and the refactor) (M)
- 🟢 Security headers in `next.config.ts` (S) — **R10**
- 🟢 `packageManager`/`engines` pin; Dependabot; gitleaks + `pnpm audit` + CodeQL in CI (S) — **R18 start**
- **Risk:** low. **Effort:** ~L total. **Unblocks everything below.**

## Phase 1 — Make it run on Cloudflare (≈3–4 weeks) 🔵 DEPLOY BLOCKERS

**Goal:** the app builds, deploys, and serves real traffic on Workers.

- 🔵 **D1 data-layer migration** — replace better-sqlite3 with async D1 via `getCloudflareContext().env.DB`;
  convert ~40 helpers + ~25 call sites to async/await; request-scoped handle (no singleton); keep a
  dev-only better-sqlite3 adapter; move `better-sqlite3` to devDependencies (XL) — **R1**
  - Collapse the public-profile fan-out into `db.batch()` while you're in there (folds in **R14** groundwork)
  - Convert read-then-write upserts to `ON CONFLICT`/`db.batch()` (M) — race fix
- 🔵 **R2 storage** — `lib/storage.ts` (`put`/`delete`/`publicUrl`); rewrite avatar/banner/background routes;
  serve via `cdn.procard.gg` + Cache Rules; drop Worker GET proxying (M–L) — **R2**
- 🔵 **wrangler env separation** — create real D1/KV/R2 resources, paste IDs, add `[env.staging]`/
  `[env.production]`, bump `compatibility_date` (M) — **R4**
- 🔵 **Validate migrations 0001–0010 on real remote D1**; fix the 0007 `PRAGMA foreign_keys` no-op (S) — **R5 dep**
- 🔵 **Secrets** — `wrangler secret put` per env; enforce `SESSION_SECRET` strength; `SECRETS.md` (M) — **R17**
- **Exit criteria:** `pnpm build:worker` green in CI; `wrangler deploy --env staging` serves a real
  profile from D1 with images from R2. **Risk:** high (touches everything) — mitigated by Phase 0 tests.

## Phase 2 — Security blockers (≈2 weeks, parallelizable with late P1) 🔴 LAUNCH BLOCKERS

- 🔴 **Fix all IDORs** — profile-scope every by-id mutation; visibility route loads profile; internal
  `updateProfile` allow-list (S–M) — **R7**
- 🔴 **Rate limiting + abuse** — WAF rules + Workers RL binding + **HMAC-signed visitor cookie** + Turnstile
  on comment/signup; social-click dedup (M) — **R9**
- 🔴 **OAuth tokens** — drop Discord tokens after callback; encrypt or remove RSO tokens (delete dead
  `refreshRsoToken`); review `email` scope; stop `SELECT *` on hot paths (M–L) — **R8**
- 🔴 **Impersonation** — badge imported/manual connections unverified; gate verified mark to RSO;
  sanitize imported strings + `org_logo_url` (M) — **R11**
- 🟡 Session revocation (`session_version`); `secure:true`; fix Riot state `secure:false`; Origin/Referer
  CSRF check (S–M) — **R7 family**
- 🟡 zod validation + error envelope; upload magic-byte sniffing + cookieless asset domain (S–M)
- **Exit criteria:** SECURITY.md checklist green; cross-tenant tests prove 403/404. **Risk:** low–med.

## Phase 3 — Scale & cost (≈2–3 weeks) — before any growth push

- **Rank refresh subsystem** — implement `scheduled()` **producer** → Queue → consumer + `RiotLimiter`
  DO; lazy refresh-on-view TTL; Riot client **timeouts + 429/Retry-After backoff** + KV cache (L) — **R5, R12, R15**
- **Engagement off D1** — Workers Analytics Engine for events; `ProfileCounter` DO + denormalized
  counters; `ctx.waitUntil`; drop per-view rows (L) — **R13**
- **Edge-cache public profile** — make the card cacheable HTML; move per-viewer bits client-side;
  purge on owner edit; read replication (Sessions API) (L) — **R14**
- **Engagement reads** — replace `COUNT(*)`/in-JS aggregation with counters + SQL `GROUP BY`/`UNION ALL`/
  `db.batch()`; normalize `esports_role` for role-faceted analytics (M) — **R13, role debt**
- **Exit criteria:** load test at target RPS within D1 write budget; cron enqueues, never fans out.

## Phase 4 — CI/CD hardening & deployment gates (≈1 week, overlaps P2/P3) 🔵

- Full `ci` (lint/type/unit/integration/build/secret-scan/audit/CodeQL) blocks merge (L) — **R18**
- `deploy-staging` (auto on `master`, +e2e+smoke) and `deploy-production` (tag + **approval** + rollback)
- Branch protection on `master`; protected `production` GitHub Environment; per-env scoped CF tokens/OIDC
- **Exit criteria:** no laptop deploys; red gate stops deploy; `wrangler rollback` rehearsed.

## Phase 5 — Launch hardening & polish (≈1 week)

- DR/backup live (D1 Time Travel runbook + daily `d1 export`→R2; R2 versioning + orphan sweep) — **DR**
- Frontend perf: split the public card into RSC + small islands; consolidate icon libs; bundle-analyze (M)
- Observability: Workers logs/analytics, error alerting, uptime smoke; Zero Trust on staging
- Remove dead/deprecated code; reconcile `types/db.ts`; drop redundant indexes; e2e coverage to ≥70% on `lib/`
- **Exit criteria:** production checklist green → public launch.

---

## Critical-path summary

```
P0 (safety net) ──► P1 (deploy blockers) ──► P2 (security) ──► P3 (scale) ──► P4/P5 (CI/CD + polish) ──► LAUNCH
   ~1wk                ~3–4wk                  ~2wk             ~2–3wk          ~2wk
```

**~10–12 weeks** to a hardened public launch (1–2 engineers). A **private/invite beta** is possible
after **P1 + P2** (~6 weeks) if growth is capped so the P3 scale limits aren't hit.

## Blocker quick-reference

- **Deploy blockers (no deploy without):** R1, R2, R3, R4, R5, R6 → Phases 0–1
- **Security/launch blockers (no public launch without):** R7, R8, R9, R10, R11 → Phase 2
- **Scale blockers (no growth push without):** R12, R13, R14, R15 → Phase 3
- **Quick wins (do in Phase 0):** R3, R6, R10, IDOR tests, signed visitor cookie, headers, RSO `secure`, dep pinning
