# ProCard.gg — Infrastructure as Code (Phase 3)

Everything reproducible from the repo + Wrangler CLI. No click-ops except the one-time resource
creation (whose IDs are then committed) and secret values (which never enter the repo).

---

## 1. Naming & environment conventions

| Thing                   | Convention                                                                            | Examples                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Environments            | `local` · `staging` · `production`                                                    | —                                                                                   |
| D1 database             | `procard-db-{env}`                                                                    | `procard-db-staging`, `procard-db-prod`                                             |
| R2 bucket               | `procard-assets-{env}`                                                                | `procard-assets-prod`                                                               |
| KV namespace            | `procard-cache-{env}`                                                                 | `procard-cache-staging`                                                             |
| Queue                   | `procard-rank-queue-{env}`                                                            | `procard-rank-queue-prod`                                                           |
| Worker                  | `procard-{env}` (prod may be bare `procard`)                                          | `procard-staging`                                                                   |
| Binding names (in code) | **stable across envs**                                                                | `DB`, `KV`, `BUCKET`, `RANK_QUEUE`, `RIOT_LIMITER`, `PROFILE_COUNTER`, `ENGAGEMENT` |
| Asset domain            | `cdn.procard.gg` (prod), `cdn-staging.procard.gg`                                     | —                                                                                   |
| Git branches            | `master`=prod source of truth, PRs→`master`; staging deploys from `master` post-merge | —                                                                                   |

**Principle:** code references **binding names**, never resource IDs; each env maps the same binding
name to a different resource. This keeps `lib/*` env-agnostic.

## 2. One-time resource creation

```bash
# Run per environment (staging, production). Paste the returned IDs into wrangler.toml.
wrangler d1 create procard-db-staging
wrangler d1 create procard-db-prod
wrangler kv namespace create procard-cache-staging
wrangler kv namespace create procard-cache-prod
wrangler r2 bucket create procard-assets-staging
wrangler r2 bucket create procard-assets-prod
wrangler queues create procard-rank-queue-staging
wrangler queues create procard-rank-queue-prod

# R2 public delivery via custom domain (or enable r2.dev for staging only)
wrangler r2 bucket domain add procard-assets-prod --domain cdn.procard.gg
```

## 3. `wrangler.toml` — proposed (env-separated)

> The top-level block is **local dev only**. `wrangler deploy --env staging|production` targets the
> scoped blocks. Replace every `<…>` with the real ID from step 2.

```toml
name = "procard"
main = ".open-next/worker.js"
compatibility_date = "2025-05-05"          # bump to current; was 2024-09-23 (stale)
compatibility_flags = ["nodejs_compat"]

[assets]
directory = ".open-next/assets"
binding = "ASSETS"

# Observability
[observability]
enabled = true

# ───────────────────────── LOCAL DEV (top-level) ─────────────────────────
[[d1_databases]]
binding = "DB"
database_name = "procard-db-local"
database_id = "local"                      # `--local` uses Miniflare; fine for dev
migrations_dir = "migrations"

[[kv_namespaces]]
binding = "KV"
id = "local"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "procard-assets-local"
preview_bucket_name = "procard-assets-local"

[[queues.producers]]
binding = "RANK_QUEUE"
queue = "procard-rank-queue-local"

[[queues.consumers]]
queue = "procard-rank-queue-local"
max_batch_size = 10
max_retries = 3
dead_letter_queue = "procard-rank-dlq-local"

[[durable_objects.bindings]]
name = "RIOT_LIMITER"
class_name = "RiotLimiter"
[[durable_objects.bindings]]
name = "PROFILE_COUNTER"
class_name = "ProfileCounter"

[[analytics_engine_datasets]]
binding = "ENGAGEMENT"
dataset = "procard_engagement_local"

[vars]                                      # NON-SECRET config only
APP_URL = "http://localhost:3000"
DISCORD_REDIRECT_URI = "http://localhost:3000/auth/callback"
RIOT_REDIRECT_URI = "http://localhost:3000/api/connect/riot/callback"

# ───────────────────────────── STAGING ─────────────────────────────
[env.staging]
[env.staging.vars]
APP_URL = "https://staging.procard.gg"
DISCORD_REDIRECT_URI = "https://staging.procard.gg/auth/callback"
RIOT_REDIRECT_URI = "https://staging.procard.gg/api/connect/riot/callback"
ASSET_BASE_URL = "https://cdn-staging.procard.gg"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "procard-db-staging"
database_id = "<STAGING_D1_ID>"
migrations_dir = "migrations"

[[env.staging.kv_namespaces]]
binding = "KV"
id = "<STAGING_KV_ID>"

[[env.staging.r2_buckets]]
binding = "BUCKET"
bucket_name = "procard-assets-staging"

[[env.staging.queues.producers]]
binding = "RANK_QUEUE"
queue = "procard-rank-queue-staging"
[[env.staging.queues.consumers]]
queue = "procard-rank-queue-staging"
max_batch_size = 10
max_retries = 3
dead_letter_queue = "procard-rank-dlq-staging"

[[env.staging.durable_objects.bindings]]
name = "RIOT_LIMITER"
class_name = "RiotLimiter"
[[env.staging.durable_objects.bindings]]
name = "PROFILE_COUNTER"
class_name = "ProfileCounter"

[[env.staging.analytics_engine_datasets]]
binding = "ENGAGEMENT"
dataset = "procard_engagement_staging"

[env.staging.triggers]
crons = ["*/30 * * * *"]

# ─────────────────────────── PRODUCTION ───────────────────────────
[env.production]
[env.production.vars]
APP_URL = "https://procard.gg"
DISCORD_REDIRECT_URI = "https://procard.gg/auth/callback"
RIOT_REDIRECT_URI = "https://procard.gg/api/connect/riot/callback"
ASSET_BASE_URL = "https://cdn.procard.gg"

[[env.production.d1_databases]]
binding = "DB"
database_name = "procard-db-prod"
database_id = "<PROD_D1_ID>"
migrations_dir = "migrations"

[[env.production.kv_namespaces]]
binding = "KV"
id = "<PROD_KV_ID>"

[[env.production.r2_buckets]]
binding = "BUCKET"
bucket_name = "procard-assets-prod"

[[env.production.queues.producers]]
binding = "RANK_QUEUE"
queue = "procard-rank-queue-prod"
[[env.production.queues.consumers]]
queue = "procard-rank-queue-prod"
max_batch_size = 10
max_retries = 3
dead_letter_queue = "procard-rank-dlq-prod"

[[env.production.durable_objects.bindings]]
name = "RIOT_LIMITER"
class_name = "RiotLimiter"
[[env.production.durable_objects.bindings]]
name = "PROFILE_COUNTER"
class_name = "ProfileCounter"

[[env.production.analytics_engine_datasets]]
binding = "ENGAGEMENT"
dataset = "procard_engagement_prod"

[env.production.triggers]
crons = ["*/30 * * * *"]

# DO migrations (declare once; classes live in the worker entry)
[[migrations]]
tag = "v1"
new_sqlite_classes = ["RiotLimiter", "ProfileCounter"]
```

> If you prefer JSON, the same structure works as `wrangler.jsonc` (OpenNext's default). Keep ONE
> format. Bindings/queues/DO are only needed once their consuming code exists — introduce them in the
> ROADMAP phase that adds the feature, not all at once.

## 4. `open-next.config.ts` (repo root — currently MISSING, a P0 blocker)

```ts
// open-next.config.ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";

export default defineCloudflareConfig({
  // Cache ISR/fetch output in KV so it survives across isolates.
  incrementalCache: kvIncrementalCache,
});
```

And wire dev bindings in `next.config.ts`:

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async headers() {
    /* see SECURITY.md §security headers */ return [];
  },
};
export default nextConfig;

// Enables getCloudflareContext() (DB/KV/R2/...) during `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```

## 5. Custom worker entry (cron + queue + DO)

OpenNext lets you wrap its fetch handler so you can add `scheduled`, `queue`, and DO exports:

```ts
// worker.ts  (set as `main` after the OpenNext build wraps it; see OpenNext custom-entry docs)
import handler from "./.open-next/worker.js";
export { RiotLimiter } from "./lib/do/riot-limiter";
export { ProfileCounter } from "./lib/do/profile-counter";

export default {
  fetch: handler.fetch,
  // PRODUCER ONLY — enqueue stale+active connections, do not call Riot here.
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(enqueueStaleConnections(env)); // bounded page via idx_gc_last_refreshed
  },
  // CONSUMER — actual Riot/Faceit calls, concurrency-limited via RIOT_LIMITER DO.
  async queue(batch, env) {
    await processRankBatch(batch, env);
  },
};
```

## 6. Secret-management strategy

| Key                                                            | Type    | Where                             | Notes                                                            |
| -------------------------------------------------------------- | ------- | --------------------------------- | ---------------------------------------------------------------- |
| `SESSION_SECRET`                                               | secret  | `wrangler secret put --env <env>` | ≥32 bytes; `openssl rand -hex 32`; **rotate** bumps all sessions |
| `DISCORD_CLIENT_SECRET`                                        | secret  | wrangler secret                   | per-env Discord app                                              |
| `RIOT_API_KEY`                                                 | secret  | wrangler secret                   | per-env if possible; treat as scarce shared resource             |
| `RIOT_CLIENT_SECRET`                                           | secret  | wrangler secret                   | RSO                                                              |
| `FACEIT_API_KEY`                                               | secret  | wrangler secret                   |                                                                  |
| `LEAGUEPEDIA_BOT_USER` / `_PASS`                               | secret  | wrangler secret                   | **currently undocumented** — surface via `lib/env.ts`            |
| `TOKEN_ENC_KEY`                                                | secret  | wrangler secret                   | AES-GCM key for at-rest OAuth-token encryption (SECURITY.md)     |
| `APP_URL`, `*_REDIRECT_URI`, `ASSET_BASE_URL`, region defaults | **var** | `[env.*.vars]`                    | non-sensitive, in repo                                           |

Rules: secrets **never** in `wrangler.toml`/`[vars]`/git. CI injects via GitHub **Environment**
secrets and runs `wrangler secret put` non-interactively (or relies on already-set secrets). Add a
`SECRETS.md` runbook listing each key, owner, and rotation cadence. Enforce `SESSION_SECRET` length
in `lib/env.ts` at boot; reject `ci-dummy`/placeholder values in the deploy job.

## 7. Disaster recovery & backups

- **D1 Time Travel** — automatic bookmark-based PITR for the last **30 days**; restore with
  `wrangler d1 time-travel restore procard-db-prod --timestamp <ISO>`. Document the runbook.
- **Logical backups** — scheduled `wrangler d1 export procard-db-prod --output backup.sql`
  (a GitHub Action on a daily cron, or the rank cron's spare capacity) → upload to a
  **versioned R2 backup bucket** with a lifecycle rule (retain 90 days). Off-platform copy monthly.
- **R2** — enable **object versioning** + a lifecycle rule; assets are also reconstructable (avatars
  fall back to Discord CDN). Add an orphan-sweep job.
- **Migrations** — forward-only, reviewed in PRs, applied via `wrangler d1 migrations apply --remote
--env <env>` as a **gated** CI step (staging first). Keep a tested rollback SQL for risky rebuilds
  (e.g. the 0007-style table rebuild).
- **Config** — `wrangler.toml` + `open-next.config.ts` are the source of truth; resource IDs committed.
- **Secrets** — stored in a team password manager / GitHub Environments; document re-provisioning.
- **RTO/RPO targets** (proposed): RPO ≤24 h (daily logical backup) / ≤30 days PITR; RTO ≤1 h
  (redeploy Worker + restore D1 + R2 intact).

## 8. Least-privilege access

- Cloudflare **API tokens scoped per env** (Workers Scripts, D1, R2, KV, Queues edit on the specific
  account/zone only) — separate tokens for staging and production, stored as GitHub Environment secrets.
- Use **Cloudflare OIDC** from GitHub Actions where possible instead of long-lived tokens.
- Dashboard access via SSO + 2FA; production deploy requires environment approval (CICD doc).
- **Zero Trust (Cloudflare Access)** in front of `staging.procard.gg` and any future internal/admin
  surface so pre-launch environments aren't publicly reachable.
