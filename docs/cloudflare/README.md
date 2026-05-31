# ProCard.gg — Cloudflare Production Readiness

This folder is the output of the **2026-05-30 full-codebase audit + target-architecture
design** for shipping ProCard.gg on Cloudflare (Workers + D1 + R2 + KV), with secure
GitHub Actions CI/CD, testing gates, IaC, and a scaling plan to hundreds of thousands of users.

Start at the repo-root [CLAUDE.md](../../CLAUDE.md) for the 2-minute version.

| Doc                                              | Phase(s) | What's in it                                                                                       |
| ------------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------- |
| [AUDIT.md](AUDIT.md)                             | 1, 9     | Executive summary, full findings by dimension (severity/impact/fix/effort), risk assessment        |
| [TARGET-ARCHITECTURE.md](TARGET-ARCHITECTURE.md) | 2        | Cloudflare-native target: Worker, D1, R2, KV, Queues, DO, Analytics Engine, caching, abuse defense |
| [INFRASTRUCTURE.md](INFRASTRUCTURE.md)           | 3        | IaC: `wrangler.toml` env separation, `open-next.config.ts`, naming, secrets, DR/backup             |
| [CICD-AND-TESTING.md](CICD-AND-TESTING.md)       | 4, 5     | GitHub Actions pipelines (PR/staging/prod), deployment gates, test strategy                        |
| [SECURITY.md](SECURITY.md)                       | 6        | OWASP-mapped hardening with concrete, copy-pasteable fixes                                         |
| [LIMITS.md](LIMITS.md)                           | 7        | Cloudflare platform limits (current), per-service validation, mitigations                          |
| [ROADMAP.md](ROADMAP.md)                         | 8        | Phased execution plan with quick wins, blockers, effort                                            |

**Verdict:** the app is **not deployable on Cloudflare today** (6 P0 blockers) and not yet
designed for the target scale, but the schema, auth primitives, and toolchain are sound. This
is an **improve-in-place** effort, not a rewrite. Estimated path to a hardened launch: **~8–12
focused engineering weeks** (see ROADMAP).
