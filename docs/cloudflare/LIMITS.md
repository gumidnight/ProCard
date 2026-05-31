# ProCard.gg — Cloudflare Limits & Validation (Phase 7)

Limits verified against official Cloudflare docs (sources at bottom). Plan assumption: **Workers
Paid** (Free is unusable at scale). "Relevance" = how each limit constrains ProCard.

---

## 1. The limits that actually constrain ProCard

| Service       | Limit                                         | Value (Free / Paid)                                                                | Why it matters here                                                                                                            |
| ------------- | --------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Workers       | CPU / request                                 | 10 ms / **30 s** (→300 s)                                                          | SSR is I/O-bound; ample. Real CPU risk is the cron, not page render.                                                           |
| Workers       | **Subrequests / invocation**                  | 50 / **10,000** default (→10M); CF-internal 1,000                                  | **The cron killer.** ~2 Riot calls/account ⇒ 400k for 200k accounts in one tick. Even raised, you hit Riot limits + CPU first. |
| Workers       | **Concurrent outbound conns**                 | **6** (both)                                                                       | Caps real fan-out to 6 in-flight Riot calls. Confirms fan-out must be a Queue, not one handler.                                |
| Workers       | Memory / isolate                              | 128 MB                                                                             | Fine for SSR. Cron must **page** D1, never `SELECT *` all connections.                                                         |
| Workers       | Script size (gzip)                            | 3 MB / **10 MB**                                                                   | OpenNext bundles all of Next.js into one Worker — watch as features grow.                                                      |
| Workers       | Requests/day · startup                        | 100k / **unlimited** · 1 s startup                                                 | Free 100k/day blown instantly ⇒ **Paid mandatory**.                                                                            |
| D1            | **Max DB size**                               | 500 MB / **10 GB (NOT increasable)**                                               | Core data fits ≪10 GB even at 1M users. **Per-view engagement rows fill it in weeks** ⇒ keep events off D1.                    |
| D1            | **Rows written**                              | 100k/day / **50M/mo** then $1/M                                                    | **The cost killer.** Per-view writes + blind cron UPDATEs (~288M/mo = ~$238/mo) blow this.                                     |
| D1            | Rows read                                     | 5M/day / **25B/mo** then $0.001/M                                                  | Generous **iff indexed**; one missing index = full scan = thousands of billed reads/page.                                      |
| D1            | Queries/invocation · params · stmt · duration | 50 / **1,000** · 100 bound params · 100 KB SQL · 30 s                              | Bulk writes must chunk to ≤100 params/~1,000 rows; no unchunked mass UPDATE/DELETE.                                            |
| D1            | Read replication (Sessions API)               | GA-beta, 6 regions, read-your-writes                                               | Offloads public-profile reads + cuts latency. Same billing; doesn't raise 10 GB cap.                                           |
| R2            | Object / count / buckets                      | 5 TiB obj · unlimited objects · 1M buckets                                         | Images are tiny ⇒ effectively unbounded headroom.                                                                              |
| R2            | Ops & egress                                  | $0.015/GB·mo · ClassA $4.50/M · ClassB $0.36/M · **egress FREE**                   | **Strongest fit.** Cache Rules ⇒ most GETs from CF cache, never billed. Near-zero cost.                                        |
| KV            | Value/key · ops · quotas                      | 25 MiB val · **1 write/sec/key**, eventual (~60 s) · 100k reads-1k writes/day Free | Great read cache (rank/profile). **Not** for counters (lost increments).                                                       |
| Rate Limiting | Binding vs WAF                                | binding: 10/60 s only, per-colo, approximate · WAF: zone, configurable, pre-Worker | Use WAF to shield origin from floods (saves D1 writes); binding for soft per-IP. 120 s refresh cooldown correctly lives in D1. |
| Turnstile     | Widgets/token                                 | 20 widgets · 300 s single-use token                                                | More than enough; gate bot-driven engagement writes.                                                                           |
| Cron          | Count · CPU · wall-clock · subreq             | 5/250 · 30 s CPU (<1h interval) · **15 min wall-clock** · 6 conns                  | `*/30` ⇒ 30 s CPU / 15 min wall-clock / 6 conns ⇒ **cannot** fan out to 100k+ accounts ⇒ **enqueue only**.                     |

## 2. Per-area verdicts

- **Workers SSR (profile pages):** ✅ SAFE on Paid. I/O-bound; 30 s CPU + 128 MB ample. Watch 10 MB bundle.
- **`*/30` cron fanning out Riot/Faceit:** ⛔ WILL BREAK — subrequests, 6-conn concurrency, 15-min
  wall-clock, **and** Riot's own rate limits all bind. Current sequential `await`-per-connection loop is
  fine for one user's 1–3 accounts, fatal as a global cron body.
- **D1 per-view engagement writes:** ⛔ WILL BREAK on cost + the 10 GB cap. Biggest risk after the cron.
- **D1 cron rank UPDATEs:** ⛔ ~288M writes/mo (~$238/mo) blind — write only on change, refresh only active.
- **D1 reads for public profiles:** ✅ SAFE iff every lookup indexed (they are). Add read replication.
- **D1 single-DB at scale:** ✅ core data ≪10 GB at 1M users; only events threaten it — move them off.
- **R2 for assets:** ✅ SAFE, huge headroom, near-zero cost with Cache Rules (free egress).
- **KV / Rate Limiting / Turnstile:** ✅ as supporting services (cache/throttle/bot-gate), not primaries.

## 3. Required mitigations (all in [TARGET-ARCHITECTURE.md](TARGET-ARCHITECTURE.md))

1. **Rank refresh** — cron = **producer only** → **Cloudflare Queues** → consumer with bounded
   concurrency + retry/backoff, gated by a **`RiotLimiter` DO** token bucket. Prefer **lazy
   refresh-on-view (TTL)**; cron tops up only stale **and recently-viewed** connections.
2. **Rank caching** — KV snapshot keyed by `(game,puuid,region)`, read-through on profile pages;
   write back to D1 **only when the rank changed**.
3. **Engagement** — raw events → **Workers Analytics Engine** (off D1); live counts → **`ProfileCounter`
   DO** buffering → periodic flush to **denormalized D1 counters**; never `COUNT(*)` per request;
   `ctx.waitUntil` for the write.
4. **D1 beyond one DB (future)** — if raw rows ever needed, **shard** across D1 DBs (Paid allows up to
   50,000) by profile-id hash/region; read replication on read-hot DBs.
5. **Batching** — bulk writes chunk to ≤100 params / ~1,000 rows in `db.batch()`; never unchunked mass
   UPDATE/DELETE (30 s query cap).
6. **Abuse/cost guard** — WAF rate limiting + Turnstile in front of engagement/auth so bots can't drive
   rows-written (the dominant variable cost).

## 4. Plan requirement

**Workers Paid ($5/mo)** is the floor. With the mitigations above, projected variable cost at
hundreds-of-thousands-of-users scale is dominated by D1 rows-written — which the Analytics-Engine +
counter design keeps within the included 50M/mo. R2 (free egress) and reads (25B/mo) have large
headroom. **No proposed component exceeds a hard limit once mitigations are applied.**

## 5. Sources

Workers limits & pricing · 2026-02-11 subrequests change · 2025-03-25 CPU limits · D1 limits/pricing ·
D1 read-replication beta · R2 limits/pricing · KV limits · Cron triggers · Rate-limit binding ·
Turnstile plans · Pages limits — all under `developers.cloudflare.com` (full URLs in the audit run log).
