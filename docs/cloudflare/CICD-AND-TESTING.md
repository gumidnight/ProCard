# ProCard.gg — CI/CD & Testing (Phases 4 & 5)

GitHub is the single source of truth. **Every change flows through a PR.** Nothing deploys from a
laptop. Production is protected and approved.

---

## 1. Pipeline overview

| Trigger                                | Pipeline            | Gates                                                                                                  | Deploy                                                                 |
| -------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **Pull request** → `master`            | `ci`                | install · lint · typecheck · unit · integration · `build:worker` · secret-scan · `pnpm audit` · CodeQL | none                                                                   |
| **Push to `master`** (post-merge)      | `deploy-staging`    | all of `ci` + e2e (Playwright)                                                                         | `wrangler deploy --env staging` + `d1 migrations apply --env staging`  |
| **Release tag `v*` / manual dispatch** | `deploy-production` | re-run gates + **manual approval** (GitHub Environment)                                                | `wrangler deploy --env production` (after staging d1 migrate verified) |

Branch protection on `master`: require `ci` green, ≥1 review, no force-push, linear history.
Production via a protected **GitHub Environment** (`production`) with required reviewers + wait timer.

## 2. Deployment gate strategy (failing tests block deploys)

```
PR ──► ci (must be green to merge) ─────────────────────────────────┐
                                                                     ▼
merge to master ──► deploy-staging (ci + e2e) ──► staging smoke test ──► ✅ staging live
                                                                     │
release tag ──► deploy-production ──► [👤 manual approval] ──► prod migrate (staging-verified)
            ──► wrangler deploy --env production ──► prod smoke test ──► (rollback on fail)
```

A red gate at any stage stops the pipeline. Production deploy additionally asserts **no
placeholder/`ci-dummy` secrets** and that staging migrations applied cleanly first.

## 3. `ci` workflow (PRs) — replaces today's typecheck/lint/build-only job

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request: { branches: [master] }
  push: { branches: [master] }
permissions: { contents: read }
jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:unit # vitest
      - run: pnpm test:integration # vitest + @cloudflare/vitest-pool-workers (Miniflare D1/KV/R2)
      - run: pnpm build:worker # opennextjs-cloudflare build — proves it packages for Workers
        env:
          {
            SESSION_SECRET: ci-dummy-not-used,
            DISCORD_CLIENT_ID: x,
            DISCORD_CLIENT_SECRET: x,
            RIOT_API_KEY: x,
            APP_URL: http://localhost:3000,
          }
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: gitleaks/gitleaks-action@v2
  deps-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high
  codeql:
    runs-on: ubuntu-latest
    permissions: { security-events: write }
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: javascript-typescript }
      - uses: github/codeql-action/analyze@v3
```

## 4. `deploy-staging` workflow

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging
on: { push: { branches: [master] } }
concurrency: { group: deploy-staging, cancel-in-progress: true }
permissions: { contents: read }
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e            # against `wrangler dev`/preview with seeded local D1
  deploy:
    needs: e2e
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build:worker
      - run: pnpm exec wrangler d1 migrations apply procard-db-staging --remote --env staging
        env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN_STAGING }}, CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }} }
      - run: pnpm exec wrangler deploy --env staging
        env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN_STAGING }}, CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }} }
      - run: pnpm exec playwright test smoke --config=playwright.smoke.ts   # hits staging.procard.gg
```

## 5. `deploy-production` workflow (approval + rollback)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production
on:
  push: { tags: ["v*"] }
  workflow_dispatch: {}
concurrency: { group: deploy-production, cancel-in-progress: false }
permissions: { contents: read }
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production        # ← required reviewers + wait timer configured in repo settings
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: node scripts/assert-secrets.mjs    # fail if any required secret missing/placeholder
      - run: pnpm build:worker
      - run: pnpm exec wrangler d1 migrations apply procard-db-prod --remote --env production
        env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN_PROD }}, CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }} }
      - run: pnpm exec wrangler deploy --env production
        env: { CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN_PROD }}, CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }} }
      - run: pnpm exec playwright test smoke --config=playwright.smoke.prod.ts
```

**Rollback:** Worker code via `wrangler rollback` (or `wrangler versions deploy <id>` for gradual
rollout/instant revert). **D1 migrations are forward-only** — ship reversible migrations and keep a
tested down-SQL for risky ones; for data corruption use D1 Time Travel. Tag every prod deploy so
`git revert` + retag reproduces a known-good build.

## 6. Testing strategy

Current state: **zero tests** (Playwright installed, no specs, no `test` script). Add scripts:
`test:unit`, `test:integration`, `test:e2e`, `test` (all). Recommended stack: **Vitest** +
**`@cloudflare/vitest-pool-workers`** (runs tests inside workerd with real D1/KV/R2 bindings) +
**Playwright** for e2e.

| Layer                    | Tooling                              | What to cover (priority order)                                                                                                                                                                                                                                |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unit**                 | Vitest                               | `lib/auth/session` HMAC sign/verify (forgery, tamper, expiry, timing) · `lib/utils/slug` · `lib/api/riot` rank/region mapping & 429 handling · `lib/utils/rank`/`color`/`country` · `MiniMarkdown` (XSS strings)                                              |
| **Integration (DB/API)** | Vitest + workers-pool (Miniflare D1) | Every `lib/db` helper against migrated D1 · **every IDOR fix** (assert cross-profile delete/patch returns 403/404) · auth-required routes return 401 · input-validation rejects oversize/enum-invalid · upload routes hit R2 binding · rate-limit returns 429 |
| **API contract**         | Vitest/supertest-style via fetch     | Response envelopes, status codes, no token/email leakage in serialized output                                                                                                                                                                                 |
| **E2E**                  | Playwright                           | onboarding → publish → public view → like/comment → dashboard edit reflects on card · login/logout · upload avatar shows on card                                                                                                                              |
| **Smoke (post-deploy)**  | Playwright (subset)                  | home 200, a known profile renders, `/api/auth/me` 401 when logged out, asset loads from `cdn.*`                                                                                                                                                               |

**Coverage gates (proposed):** ≥70% on `lib/` (the security-critical core) before the D1 migration
merges; the migration PR must include integration tests for every converted helper. **Write the IDOR
and session tests first** — they are cheap and lock in the most important fixes.

**Deployment gate rule:** `ci` (unit+integration) blocks merge; `e2e` blocks staging; smoke blocks
the production step from being marked successful (failure triggers rollback).
