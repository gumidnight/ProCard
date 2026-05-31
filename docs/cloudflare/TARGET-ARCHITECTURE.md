# ProCard.gg — Target Architecture on Cloudflare (Phase 2)

Design goals: respect the existing Next.js 16 / OpenNext choice, deliver every asset from R2 with
near-zero bandwidth cost, keep D1 inside its hard limits, and scale from hundreds to **hundreds of
thousands of users** without re-platforming. Least privilege, environment separation, and abuse
prevention are built in, not bolted on.

---

## 1. Topology

```
                          ┌──────────────────────────────────────────────┐
                          │  Cloudflare Edge (WAF · Rate Limiting · Cache  │
                          │  Rules · Turnstile · Bot Mgmt · DDoS)          │
                          └───────────────┬──────────────────────────────┘
                                          │
               ┌──────────────────────────┴───────────────────────────┐
               │                                                        │
       cdn.procard.gg                                          procard.gg / app
   (R2 public custom domain)                            ┌──────────────────────────┐
   avatars · banners · bg ·                             │  procard (OpenNext Worker)│
   team logos · brand assets                            │  SSR + static assets + API│
   edge-cached, 0 egress                                └─────┬───────────┬─────────┘
                                                              │           │
                          ┌───────────────────────────────────┘           │
                          │                ┌──────────────┐                │
                  ┌───────▼──────┐   ┌─────▼─────┐  ┌─────▼──────┐  ┌──────▼───────┐
                  │  D1          │   │  KV        │  │  R2        │  │ Analytics    │
                  │ procard-db   │   │ procard-   │  │ procard-   │  │ Engine       │
                  │ core data +  │   │ cache      │  │ assets     │  │ engagement   │
                  │ counters     │   │ rank/profile│ │ (writes)   │  │ events       │
                  └──────────────┘   │ + RL ctrs  │  └────────────┘  └──────────────┘
                          ▲          └────────────┘
                          │
          ┌───────────────┴───────────────┐
          │  Rank refresh subsystem        │
          │  cron(*/30) ─► Queue ─► consumer Worker │
          │  + RiotLimiter Durable Object (token bucket) │
          │  + ProfileCounter Durable Object (live counts)│
          └────────────────────────────────┘
```

## 2. Service-by-service

### 2.1 Compute — one OpenNext Worker (`procard`)

- `@opennextjs/cloudflare` bundles the Next.js server into **one Worker** that serves SSR, API
  routes, middleware, **and** static assets (the asset handler is edge-cached identically to Pages).
- **This is the answer to "Pages for the frontend + Workers for the backend."** A Next.js App Router
  app with SSR + middleware + API routes cannot be split into Pages(static)+Workers(API) without a
  major restructure; the OpenNext Worker is the correct CF-native model and is already the repo's
  chosen path. Static/ISR pages are still served from cache, so the "Pages" intent (cheap, cached
  frontend) is fully met.
- **Plan: Workers Paid ($5/mo)** is mandatory (Free's 100k req/day and 10 ms CPU are exceeded
  immediately). 30 s CPU default is ample for I/O-bound SSR.

### 2.2 Database — D1 (`procard-db`)

- **Holds only:** `users`, `profiles`, `game_connections`, `social_links`, `team_history`,
  `roles_played`, and **denormalized engagement counters** (`profiles.view_count`/`like_count`/
  `comment_count`) + small daily/hourly **rollup** tables. This core data is tiny (KB/row) and fits
  comfortably under the **non-increasable 10 GB single-DB cap** even at 1M users.
- **Read replication (Sessions API)** for public-profile reads → lower latency + offload the primary.
- **Access pattern:** request-scoped handle via `getCloudflareContext().env.DB`; **no module singleton**.
  Collapse the per-profile fan-out into **one `db.batch([...])`** (one round-trip) or JOINed queries.
- **Migrations:** `wrangler d1 migrations apply` only. Remove the in-app `ensureMigrated()` runner.

### 2.3 Object storage — R2 (`procard-assets`)

- All avatars, banners, backgrounds, team logos, brand assets. Keys: `avatars/{profileId}/{uuid}.{ext}`.
- **Delivery via a public custom domain `cdn.procard.gg`** fronted by **Cache Rules** (long browser+edge
  TTL, immutable). Bytes are **not** proxied through the Worker → near-zero CPU/egress; **R2 egress is
  free** and most GETs are served from cache (never billed as Class B ops).
- Upload path: `env.BUCKET.put(key, bytes, { httpMetadata })` with **server-side magic-byte sniffing**
  (reject SVG), optional **Cloudflare Images** transform for resize/format/EXIF-strip.
- A thin `lib/storage.ts` (`put`/`delete`/`publicUrl`) abstracts R2 (+ a dev shim) so routes never
  touch `node:fs`.

### 2.4 Cache & ephemeral state — KV (`procard-cache`)

- Read-through cache for **live rank snapshots** (`rank:{game}:{puuid}:{region}`, short TTL) and hot
  **profile fragments**, cutting D1 billed `rows_read`.
- Per-IP **rate-limit counters** for soft throttling.
- **Not** the source of truth for counters (1 write/sec/key + eventual consistency loses increments).

### 2.5 Rank-refresh subsystem — Cron → Queue → Consumer + Durable Objects

- **Primary mechanism = lazy refresh-on-view** with a TTL: a profile view re-fetches a connection's
  rank only if `last_refreshed_at` is older than e.g. 6 h, via the cache.
- **Cron (`*/30`) is a PRODUCER only:** it `SELECT`s a bounded page of stale **and recently-viewed**
  connections (using `idx_gc_last_refreshed`) and **enqueues** them onto **Cloudflare Queues**. It does
  **no** upstream calls itself (the 15-min wall-clock, 6-concurrent-connection, and subrequest caps make
  in-handler fan-out impossible).
- **Queue consumer Worker** does the Riot/Faceit calls with controlled concurrency, timeouts, and
  retry/backoff, gated by a **`RiotLimiter` Durable Object** (global token bucket honouring the shared
  key's rate limit). Writes back to D1 **only when the rank value changed** (eliminates ~all of the
  ~288M/mo blind UPDATEs).

### 2.6 Engagement / analytics — Workers Analytics Engine + `ProfileCounter` DO

- **Raw view/like/click events → Workers Analytics Engine** (purpose-built, high-cardinality, cheap,
  queried via its SQL API) — keeps the per-event firehose **off D1** so the 10 GB cap and the 50M
  rows-written/mo quota are never threatened. This directly powers the premium **"who scouts you"**
  analytics roadmap.
- **Live counts → `ProfileCounter` Durable Object** per profile buffers increments in memory and flushes
  **denormalized counters** to D1 periodically. Public pages read the O(1) counter, never `COUNT(*)`.
- View pings use `ctx.waitUntil(...)` so they never block the response.

### 2.7 Edge security & abuse prevention

- **WAF Rate Limiting rules** in front of engagement + auth + connect endpoints (enforced before the
  Worker runs, so bots can't drive D1 write cost). **Workers rate-limit binding** (10/60 s, per-colo)
  for cheap per-IP soft limits.
- **Turnstile** on signup / profile-claim / comment compose.
- **HMAC-signed visitor cookie** (like the session) so engagement dedup can't be trivially forged.
- **Security headers** (CSP/HSTS/X-Frame-Options/Referrer-Policy/nosniff/Permissions-Policy) via
  `next.config.ts` `headers()` or middleware.
- **DDoS**: Cloudflare's always-on L3/4/7 protection (automatic on proxied zones).

## 3. Request flows (the two hot paths)

**Public profile view (`GET /{slug}`):**

1. Edge cache hit on the cacheable HTML shell → served with **0** Worker DB work (most views).
2. Cache miss → Worker `db.batch()` (1 round-trip, read replica) → render. Counters read O(1).
3. Client-side: `ProfileEngagement` island fires a signed view ping → WAF/RL → Worker →
   `ctx.waitUntil` writes the event to Analytics Engine + increments the `ProfileCounter` DO. No
   per-view D1 row.
4. Images load directly from `cdn.procard.gg` (R2, edge-cached).

**Rank freshness:** view triggers lazy refresh-if-stale via KV; cron tops up stale+active connections
through the Queue. Owner "Refresh now" keeps its 120 s D1-backed cooldown.

## 4. Environments

`local` (Miniflare bindings + better-sqlite3 dev adapter) · `staging` · `production`. Each env binds
**separate** D1/KV/R2/Queue resources. See [INFRASTRUCTURE.md](INFRASTRUCTURE.md) for the IaC and the
naming convention (`procard-{resource}-{env}`).

## 5. Cost posture (target, Workers Paid)

| Driver          | Mitigation                                         | Net                |
| --------------- | -------------------------------------------------- | ------------------ |
| Worker requests | Edge-cache public HTML; assets bypass Worker       | low                |
| D1 rows-written | No per-view rows (AE); update ranks only on change | well under 50M/mo  |
| D1 rows-read    | Indexed + batched + KV read-through + replicas     | within 25B/mo free |
| D1 storage      | Events off D1; core data tiny                      | ≪ 10 GB            |
| R2              | Free egress + Cache Rules → most GETs from cache   | ~storage only      |
| KV/Queues/DO/AE | Read-optimised, bounded                            | marginal           |

The dominant variable cost is **D1 rows-written driven by engagement** — which the Analytics-Engine +
counter design removes. See [LIMITS.md](LIMITS.md) for the validated numbers.
